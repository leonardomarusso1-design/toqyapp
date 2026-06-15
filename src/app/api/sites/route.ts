import { listBiosites } from "@/lib/dataProvider";

export async function GET() {
  return Response.json({ sites: listBiosites(), source: "dataProvider:local" });
}
