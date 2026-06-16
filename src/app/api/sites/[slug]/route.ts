import { validateClientKey, getBiositeBySlug } from "@/lib/dataProvider";

type VerifyBody = { edit_key?: string };
type VerifyResponse = { 
  ok: boolean; 
  message?: string;
  source: string;
};

/**
 * POST /api/sites/[slug]/verify-key
 * 
 * Verify client access key for editing a biosite.
 * 
 * Request: { edit_key: string }
 * Response: { ok: boolean, message?: string }
 * 
 * Security Features:
 * - Validates key format
 * - Rate limiting recommended at reverse proxy level
 * - Logs verification attempts (TODO: Phase 7)
 * - Returns 401 for security (no hints about valid keys)
 */
export async function POST(
  request: Request, 
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    const { slug } = await params;
    const body = (await request.json().catch(() => ({}))) as VerifyBody;
    const editKey = body.edit_key?.trim();

    // Validate input
    if (!editKey || editKey.length === 0) {
      const response: VerifyResponse = { 
        ok: false, 
        message: "Access key is required",
        source: "verify-key:local"
      };
      return Response.json(response, { status: 401 });
    }

    // Validate key format (XXXX-XXXX)
    if (!/^\d{4}-\d{4}$/.test(editKey)) {
      const response: VerifyResponse = { 
        ok: false,
        message: "Invalid key format",
        source: "verify-key:local"
      };
      return Response.json(response, { status: 401 });
    }

    // Check biosite exists
    const site = getBiositeBySlug(slug);
    if (!site) {
      const response: VerifyResponse = { 
        ok: false,
        message: "Biosite not found",
        source: "verify-key:local"
      };
      return Response.json(response, { status: 404 });
    }

    // Validate key
    const isValid = Boolean(validateClientKey(editKey, slug));
    
    if (!isValid) {
      const response: VerifyResponse = { 
        ok: false,
        message: "Invalid access key",
        source: "verify-key:local"
      };
      // TODO: Log failed attempt for analytics (Phase 7)
      return Response.json(response, { status: 401 });
    }

    const response: VerifyResponse = { 
      ok: true,
      source: "verify-key:local"
    };
    // TODO: Log successful validation (Phase 7)
    // TODO: Issue session JWT token (Phase 5 - production)
    return Response.json(response, { status: 200 });

  } catch (error) {
    console.error("[verify-key] Error:", error);
    const response: VerifyResponse = { 
      ok: false,
      message: "Server error",
      source: "verify-key:error"
    };
    return Response.json(response, { status: 500 });
  }
}
