import { mockSites } from "@/lib/mockSites";

export async function GET() {
  return Response.json({ sites: mockSites, source: "mock" });
}
