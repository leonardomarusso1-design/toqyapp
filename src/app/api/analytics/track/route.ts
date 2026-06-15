import { NextRequest } from "next/server";

type TrackEventBody = {
  eventType: string;
  bioSiteId: string;
  buttonId?: string;
  buttonLabel?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * POST /api/analytics/track
 * 
 * Track an analytics event for a biosite.
 * This is a simple endpoint that logs events.
 * 
 * Phase 7: Currently logs to console/database
 * Phase 8: Will integrate with Supabase analytics_events table
 * 
 * Body: {
 *   eventType: AnalyticsEventType,
 *   bioSiteId: string,
 *   buttonId?: string,
 *   buttonLabel?: string,
 *   userAgent?: string,
 *   metadata?: object
 * }
 * 
 * Response: { success: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as TrackEventBody;

    // Validate required fields
    if (!body.eventType || !body.bioSiteId) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") ||
                     "unknown";
    const userAgent = body.userAgent || request.headers.get("user-agent");
    const referer = request.headers.get("referer");

    // Log event (TODO: Phase 8 - persist to Supabase)
    console.log("[Analytics Event]", {
      timestamp: new Date().toISOString(),
      eventType: body.eventType,
      bioSiteId: body.bioSiteId,
      buttonId: body.buttonId,
      buttonLabel: body.buttonLabel,
      ipAddress,
      userAgent,
      referer,
      metadata: body.metadata,
    });

    // TODO: Phase 8 - Save to Supabase analytics_events table
    // await supabase
    //   .from('analytics_events')
    //   .insert({
    //     bio_site_id: body.bioSiteId,
    //     event_type: body.eventType,
    //     button_id: body.buttonId,
    //     button_label: body.buttonLabel,
    //     user_agent: userAgent,
    //     ip_address: ipAddress,
    //     referer,
    //     metadata: body.metadata,
    //   });

    return Response.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("[Analytics] Error tracking event:", error);
    return Response.json(
      { success: false, error: "Failed to track event" },
      { status: 500 }
    );
  }
}
