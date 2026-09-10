import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Nfc, Star } from "lucide-react";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { isSafePlateDestination } from "@/lib/plate/redirect";

export const metadata: Metadata = { robots: { index: false } };
// Sempre dinâmica — resolve o token, registra o scan e redireciona.
export const dynamic = "force-dynamic";

// Rota pública dinâmica da placa (Fase 3). O QR impresso e o chip NFC
// carregam toqy.com.br/r/{public_token}. Aqui:
//  1. resolve o token -> unidade
//  2. registra o evento de scan (best-effort)
//  3. se ativada + destino válido -> redirect
//  4. se não ativada -> tela de ativação
//  5. se suspensa/cancelada/inexistente -> tela segura, sem vazar nada
export default async function PlateRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!hasSupabaseEnv() || !/^[A-Z0-9]{8,40}$/.test(token)) {
    return <PlateShell><NotFound /></PlateShell>;
  }

  const supabase = getSupabaseAdmin()!;
  const { data: unit } = await supabase
    .from("toqy_plate_units")
    .select("id, status")
    .eq("public_token", token)
    .maybeSingle();

  if (!unit) return <PlateShell><NotFound /></PlateShell>;

  // Scan event — nunca bloqueia a resposta
  await supabase
    .from("toqy_plate_scan_events")
    .insert({ unit_id: unit.id, event_type: unit.status === "activated" ? "redirect" : "activation_page_view" })
    .then(undefined, () => {});

  if (unit.status === "activated") {
    const { data: dest } = await supabase
      .from("toqy_plate_destinations")
      .select("destination_url")
      .eq("unit_id", unit.id)
      .eq("is_active", true)
      .maybeSingle();

    if (dest?.destination_url && isSafePlateDestination(dest.destination_url)) {
      redirect(dest.destination_url);
    }
    return <PlateShell><ErrorState msg="O destino desta placa ainda não foi configurado. Fale com quem te entregou a placa." /></PlateShell>;
  }

  if (["available_for_activation", "shipped", "in_stock", "manufacturing"].includes(unit.status)) {
    return <PlateShell><NotActivated token={token} /></PlateShell>;
  }

  // suspended, blocked, cancelled, reserved
  return <PlateShell><ErrorState msg="Esta placa está temporariamente indisponível." /></PlateShell>;
}

function PlateShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-16 text-ink">
      <div className="w-full max-w-sm rounded-[2rem] border border-border bg-white p-8 text-center shadow-lg">
        {children}
      </div>
    </main>
  );
}

function NotActivated({ token }: { token: string }) {
  return (
    <>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Nfc className="h-7 w-7" /></div>
      <h1 className="mt-5 text-2xl font-black">Esta placa ainda não foi ativada</h1>
      <p className="mt-2 text-sm text-muted">Se você é revendedor Toqy, ative esta placa e ligue ela ao negócio do seu cliente.</p>
      <Link href={`/app/placas/ativar?token=${encodeURIComponent(token)}`} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-3.5 font-black text-white transition hover:bg-accent-dim">
        Ativar placa
      </Link>
      <p className="mt-4 text-xs text-muted">Não é revendedor? <Link href="/placas" className="font-black text-accent-dim underline">Conheça as placas Toqy</Link></p>
    </>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><AlertTriangle className="h-7 w-7" /></div>
      <h1 className="mt-5 text-xl font-black">Ops</h1>
      <p className="mt-2 text-sm text-muted">{msg}</p>
      <Link href="/placas" className="mt-6 inline-flex text-sm font-black text-accent-dim underline">Placas Toqy</Link>
    </>
  );
}

function NotFound() {
  return (
    <>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted"><Star className="h-7 w-7" /></div>
      <h1 className="mt-5 text-xl font-black">Placa não encontrada</h1>
      <p className="mt-2 text-sm text-muted">Confira o código ou fale com quem te entregou a placa.</p>
      <Link href="/placas" className="mt-6 inline-flex text-sm font-black text-accent-dim underline">Placas Toqy</Link>
    </>
  );
}
