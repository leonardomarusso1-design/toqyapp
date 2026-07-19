import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { blogPosts } from "@/data/blogPosts";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const staticRoutes: MetadataRoute.Sitemap = [
  { url: siteUrl, changeFrequency: "weekly", priority: 1 },
  { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/demo`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/termos`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${siteUrl}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${siteUrl}/cookies`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${siteUrl}/contrato-assinatura`, changeFrequency: "yearly", priority: 0.2 },
];

// Bio sites ativos entram no sitemap dinamicamente — /b/[slug] e a URL
// canonica (ver fix do item 5 da auditoria de seguranca) e e o unico
// conteudo publico que muda com frequencia real.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return staticRoutes;

  const { data } = await supabase
    .from("toqy_biosites")
    .select("slug")
    .eq("status", "active");

  const bioSiteRoutes: MetadataRoute.Sitemap = (data ?? []).map((row) => ({
    url: `${siteUrl}/b/${row.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...bioSiteRoutes, ...blogRoutes];
}
