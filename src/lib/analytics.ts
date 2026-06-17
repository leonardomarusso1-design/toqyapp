/**
 * Analytics Events Tracking
 * FASE 7 — Analytics Structure
 * 
 * Defines event types and utilities for tracking biosite interactions.
 */

export type AnalyticsEventType =
  | "page_view"
  | "whatsapp_click"
  | "instagram_click"
  | "pix_click"
  | "wifi_click"
  | "phone_click"
  | "maps_click"
  | "booking_click"
  | "review_click"
  | "catalog_view"
  | "qr_scan";

export type AnalyticsEvent = {
  id: string;
  bioSiteId: string;
  eventType: AnalyticsEventType;
  buttonId?: string;
  buttonLabel?: string;
  userAgent?: string;
  ipAddress?: string;
  referer?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type AnalyticsSummary = {
  totalViews: number;
  whatsappClicks: number;
  instagramClicks: number;
  pixClicks: number;
  wifiClicks: number;
  bookingClicks: number;
  mapClicks: number;
  reviewClicks: number;
  catalogViews: number;
  qrScans: number;
  topButtons: Array<{ buttonId: string; label: string; clicks: number }>;
};

/**
 * Event label mappings
 */
export const EVENT_LABELS: Record<AnalyticsEventType, string> = {
  page_view: "Visualizações",
  whatsapp_click: "Cliques WhatsApp",
  instagram_click: "Cliques Instagram",
  pix_click: "Cliques Pix",
  wifi_click: "Cliques Wi-Fi",
  phone_click: "Cliques Telefone",
  maps_click: "Cliques Mapa",
  booking_click: "Cliques Agendamento",
  review_click: "Cliques Avaliação",
  catalog_view: "Visualizações Catálogo",
  qr_scan: "Scans QR Code",
};

/**
 * Track an analytics event
 * 
 * Usage:
 * trackEvent("pix_click", "barbearia-andrian-id", {
 *   buttonId: "barbearia-pix",
 *   buttonLabel: "Chave Pix"
 * })
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  bioSiteId: string,
  options?: {
    buttonId?: string;
    buttonLabel?: string;
    metadata?: Record<string, string | number | boolean | null>;
  }
): Promise<void> {
  try {
    // Get device/browser info from navigator if available
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;

    // Send to analytics endpoint (non-blocking)
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        bioSiteId,
        buttonId: options?.buttonId,
        buttonLabel: options?.buttonLabel,
        userAgent,
        metadata: options?.metadata,
      }),
    }).catch(() => {
      // Silently fail - don't disrupt user experience
    });
  } catch (error) {
    // silenced in production
  }
}

/**
 * Client-side event tracking utilities
 */
export const analytics = {
  /**
   * Track page view (call once on biosite load)
   */
  trackPageView: (bioSiteId: string) =>
    trackEvent("page_view", bioSiteId),

  /**
   * Track button click
   */
  trackButtonClick: (
    eventType: AnalyticsEventType,
    bioSiteId: string,
    buttonId: string,
    buttonLabel: string
  ) =>
    trackEvent(eventType, bioSiteId, {
      buttonId,
      buttonLabel,
    }),

  /**
   * Track WhatsApp click
   */
  trackWhatsApp: (bioSiteId: string, number: string) =>
    trackEvent("whatsapp_click", bioSiteId, {
      metadata: { number },
    }),

  /**
   * Track Instagram click
   */
  trackInstagram: (bioSiteId: string, profile: string) =>
    trackEvent("instagram_click", bioSiteId, {
      metadata: { profile },
    }),

  /**
   * Track Pix click
   */
  trackPix: (bioSiteId: string, pixKey: string) =>
    trackEvent("pix_click", bioSiteId, {
      metadata: { pixKey: pixKey.substring(0, 3) + "***" }, // Masked for privacy
    }),

  /**
   * Track Wi-Fi click
   */
  trackWifi: (bioSiteId: string, ssid: string) =>
    trackEvent("wifi_click", bioSiteId, {
      metadata: { ssid },
    }),

  /**
   * Track QR scan (via query param or referrer)
   */
  trackQRScan: (bioSiteId: string) =>
    trackEvent("qr_scan", bioSiteId),

  /**
   * Track catalog view
   */
  trackCatalogView: (bioSiteId: string) =>
    trackEvent("catalog_view", bioSiteId),
};

/**
 * Analytics dashboard metrics
 * 
 * Expected dashboard metrics:
 * 1. Total page views (funnel entry)
 * 2. Click-through rate by button type
 * 3. Top performing buttons
 * 4. Geographic distribution (from IP)
 * 5. Device/browser breakdown
 * 6. Time-series trends (daily, weekly, monthly)
 * 7. Conversion funnel (view -> click -> action)
 */
