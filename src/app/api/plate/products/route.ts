import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import type { PlateProductType } from "@/lib/plate/types";

// Catálogo público de produtos do módulo Placas & Avaliações (Fase 1.5).
// Rota pública (a landing/wizard lista sem login). Só produtos ativos.
// Cache curto — o catálogo muda raramente.
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" };

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  format: PlateProductType["format"];
  technology: PlateProductType["technology"];
  unit_price: number | string;
  active: boolean;
  stock_quantity: number | null;
  images: unknown;
};

export async function GET() {
  if (!hasSupabaseEnv()) return Response.json({ products: [] }, { headers: CACHE_HEADERS });
  const supabase = getSupabaseAdmin()!;

  const { data, error } = await supabase
    .from("toqy_plate_product_types")
    .select("id, name, slug, description, format, technology, unit_price, active, stock_quantity, images")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[api/plate/products]", error.message);
    return Response.json({ products: [] }, { status: 500 });
  }

  const products: PlateProductType[] = (data ?? []).map((r: Row) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    format: r.format,
    technology: r.technology,
    unitPrice: Number(r.unit_price) || 0,
    active: r.active,
    stockQuantity: r.stock_quantity,
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
  }));

  return Response.json({ products }, { headers: CACHE_HEADERS });
}
