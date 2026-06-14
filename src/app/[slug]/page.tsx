import { PixHub } from "@/components/PixHub";
import { getMockSiteBySlug } from "@/lib/mockSites";
export default async function PixPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const site = getMockSiteBySlug(slug); if (!site) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><h1 className="text-3xl font-black">Pix Hub não encontrado</h1></main>; return <PixHub site={site} />; }
