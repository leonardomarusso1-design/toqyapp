import { getSupabaseAdmin } from "@/lib/supabaseServer";

type KiwifyWebhookEvent =
  | "purchase_approved"
  | "subscription_renewed"
  | "subscription_canceled"
  | "refund";

type KiwifyWebhookBody = {
  event?: KiwifyWebhookEvent;
  customer_email?: string;
  customer_name?: string;
  product_name?: string;
  kiwify_customer_id?: string;
  webhook_secret?: string;
};

type PlanTier = "free" | "community" | "freelancer" | "agency";

function getPlanTier(productName: string): PlanTier | null {
  const normalizedProductName = productName.toLowerCase();

  if (normalizedProductName.includes("comunidade")) {
    return "community";
  }

  if (normalizedProductName.includes("freelancer")) {
    return "freelancer";
  }

  if (normalizedProductName.includes("agencia") || normalizedProductName.includes("agency")) {
    return "agency";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as KiwifyWebhookBody | null;

    if (!body) {
      return Response.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const expectedSecret = process.env.KIWIFY_WEBHOOK_SECRET;

    if (!expectedSecret) {
      return Response.json(
        { success: false, error: "Webhook secret is not configured" },
        { status: 500 }
      );
    }

    if (body.webhook_secret !== expectedSecret) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!body.event || !body.customer_email) {
      return Response.json(
        { success: false, error: "Missing required fields: event and customer_email" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return Response.json(
        { success: false, error: "Supabase admin client is not configured" },
        { status: 500 }
      );
    }

    const customerEmail = body.customer_email.trim().toLowerCase();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, plan_tier")
      .eq("email", customerEmail)
      .maybeSingle();

    if (profileError) {
      return Response.json(
        { success: false, error: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return Response.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    let updateData: {
      full_name?: string;
      kiwify_customer_id?: string;
      plan_tier?: PlanTier;
      subscription_status?: "active" | "canceled";
    } = {};

    switch (body.event) {
      case "purchase_approved": {
        if (!body.product_name || !body.kiwify_customer_id) {
          return Response.json(
            { success: false, error: "Missing required fields for purchase_approved: product_name and kiwify_customer_id" },
            { status: 400 }
          );
        }

        const planTier = getPlanTier(body.product_name);

        if (!planTier) {
          return Response.json(
            { success: false, error: "Unsupported product_name for plan mapping" },
            { status: 400 }
          );
        }

        updateData = {
          plan_tier: planTier,
          subscription_status: "active",
          kiwify_customer_id: body.kiwify_customer_id.trim(),
        };

        if (body.customer_name?.trim()) {
          updateData.full_name = body.customer_name.trim();
        }

        break;
      }
      case "subscription_renewed":
        updateData = {
          subscription_status: "active",
        };
        break;
      case "subscription_canceled":
      case "refund":
        updateData = {
          plan_tier: "free",
          subscription_status: "canceled",
        };
        break;
      default:
        return Response.json(
          { success: false, error: "Unsupported event type" },
          { status: 400 }
        );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id);

    if (updateError) {
      return Response.json(
        { success: false, error: "Failed to update profile", details: updateError.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        event: body.event,
        email: customerEmail,
        profile_id: profile.id,
        applied_changes: updateData,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      { success: false, error: "Failed to process webhook", details: message },
      { status: 500 }
    );
  }
}