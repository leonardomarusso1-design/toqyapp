"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Camera, CheckCircle2, ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { PLAN_BIOSITE_LIMITS } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateReferralCode } from "@/lib/referral";

type PlanTier = keyof typeof PLAN_BIOSITE_LIMITS;
type Profile = {
  id: string; email: string; full_name: string | null;
  plan_tier: PlanTier | null; plan_toqy?: PlanTier | null;
  biosites_limit?: number; biosites_count?: number;
  subscription_status?: string; avatar_url?: string;
  referral_code?: string | null; referral_bonus_biosites?: number;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito", community: "Essencial", freelancer: "Freelancer", agency: "Agência",
};
const PLAN_COLORS: Record<string, string> = {
  free: "bg-surface text-muted", community: "bg-emerald-100 text-emerald-800",
  freelancer: "bg-violet/10 text-violet", agency: "bg-amber-100 text-amber-800",
};
const PLAN_KIWIFY: Record<string, string> = {
  community: "https://pay.kiwify.com.br/12uYE0c",
  freelancer: "https://pay.kiwify.com.br/gTIhv6I",
  agency: "https://pay.kiwify.com.br/xFdnxvE",
};

export default function ConfiguracoesPage() {
  const router = useRouter();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  // Programa de indicação (2026-07-16)
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [copiedReferral, setCopiedReferral] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (!active) return;
      if (data) {
        setProfile(data as Profile);
        setName(data.full_name || "");
      }
      setLoading(false);

      const [code, { count }] = await Promise.all([
        getOrCreateReferralCode(session.user.id, supabase),
        supabase.from("toqy_referrals").select("id", { count: "exact", head: true }).eq("referrer_profile_id", session.user.id).eq("rewarded", true),
      ]);
      if (!active) return;
      setReferralCode(code);
      setReferralCount(count ?? 0);
    }
    load();
    return () => { active = false; };
  }, [router]);

  const referralLink = typeof window !== "undefined" && referralCode ? `${window.location.origin}/?ref=${referralCode}` : "";

  async function copyReferralLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 1500);
  }

  async function saveName() {
    if (!profile) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: name }).eq("id", profile.id);
    setProfile(p => p ? { ...p, full_name: name } : p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function uploadAvatar(file: File) {
    if (!profile || !file.type.startsWith("image/")) return;
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      // Bug real corrigido em 2026-07-06: mesmo problema de bandwidth do
      // site_data dos biosites (ver src/lib/imageStorage.ts) — avatar_url
      // ia direto como base64 pro banco. Sobe pro Storage e salva só o link.
      try {
        const res = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, slug: profile.id, fieldId: "avatar" }),
        });
        const data: { url?: string } = await res.json();
        const finalUrl = data.url ?? dataUrl;
        await supabase.from("profiles").update({ avatar_url: finalUrl }).eq("id", profile.id);
        setProfile(p => p ? { ...p, avatar_url: finalUrl } : p);
      } finally {
        setAvatarUploading(false);
        if (avatarRef.current) avatarRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) return (
    <DashboardShell>
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    </DashboardShell>
  );

  const planTier = (profile?.plan_toqy || profile?.plan_tier || "free") as string;
  const planLabel = PLAN_LABELS[planTier] ?? "Gratuito";
  const planLimit = profile?.biosites_limit ?? PLAN_BIOSITE_LIMITS[planTier as PlanTier] ?? 1;
  const planCount = profile?.biosites_count ?? 0;
  const usagePct = planLimit > 0 ? Math.min((planCount / planLimit) * 100, 100) : 0;
  const isActive = profile?.subscription_status === "active";
  const initials = (profile?.full_name || profile?.email || "U").charAt(0).toUpperCase();

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl space-y-5">

        {/* PERFIL */}
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-black text-ink">Perfil</h2>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-accent bg-surface flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-ink">{initials}</span>
                )}
              </div>
              <button
                onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow hover:bg-accent-dim"
              >
                {avatarUploading ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-ink">{profile?.full_name || "Usuário"}</p>
              <p className="truncate text-sm text-muted">{profile?.email}</p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-black ${PLAN_COLORS[planTier] ?? PLAN_COLORS.free}`}>{planLabel}</span>
            </div>
            <button onClick={signOut} className="shrink-0 flex items-center gap-1.5 rounded-2xl border border-border px-3 py-2 text-xs font-black text-muted hover:border-red-200 hover:text-red-600">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>

          {/* Editar nome */}
          <div className="mt-5 space-y-3">
            <div>
              <label className="block text-sm font-black text-ink mb-1">Nome</label>
              <div className="flex gap-2">
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
                  placeholder="Seu nome"
                />
                <button onClick={saveName} disabled={saving} className="rounded-2xl bg-accent px-4 py-3 text-sm font-black text-white hover:bg-accent-dim disabled:opacity-60">
                  {saved ? <CheckCircle2 className="h-4 w-4" /> : saving ? "..." : "Salvar"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-black text-ink mb-1">E-mail</label>
              <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* PLANO */}
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-black text-ink">Plano atual</h2>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-ink">{planLabel}</p>
                <p className={`mt-1 text-sm font-bold ${isActive ? "text-emerald-600" : "text-red-500"}`}>
                  {isActive ? "● Ativa" : "● Inativa"}
                </p>
              </div>
              <span className={`rounded-2xl px-4 py-2 text-sm font-black ${PLAN_COLORS[planTier] ?? PLAN_COLORS.free}`}>{planLabel}</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs font-black text-muted mb-1">
                <span>Bio sites criados</span>
                <span>{planCount} / {planLimit}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${usagePct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{Math.round(usagePct)}% do limite utilizado</p>
            </div>
          </div>

          {/* Discord — aberto pra qualquer plano (2026-07-16): acesso à
              comunidade virou gratuito/aberto. Aponta pro formulário/quiz de
              entrada (leonardomarusso.com.br/comunidade), não pro convite
              direto do Discord — o Leonardo usa esse formulário como porta
              de entrada pra saber quem de fato está na comunidade e poder
              integrar isso com o resto depois. */}
          <a href="https://www.leonardomarusso.com.br/comunidade" target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center justify-between rounded-2xl bg-violet p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              <div>
                <p className="font-black text-white text-sm">Comunidade TOQY</p>
                <p className="text-xs text-white/70">Responda o formulário e entre no Discord</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/70" />
          </a>

          {/* Upgrade para free */}
          {planTier === "free" && (
            <div className="mt-4 rounded-2xl border border-violet/20 bg-violet/10 p-4">
              <p className="font-black text-ink">Faça upgrade para criar mais bio sites</p>
              <p className="mt-1 text-sm text-muted">Acesse recursos avançados e crie até 20 bio sites.</p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <a href={PLAN_KIWIFY.community} target="_blank" className="rounded-2xl bg-violet px-4 py-2.5 text-sm font-black text-white hover:opacity-90">Essencial R$29,90</a>
                <Link href="/#planos" className="rounded-2xl border border-violet/30 px-4 py-2.5 text-sm font-black text-violet hover:bg-violet/10">Ver planos</Link>
              </div>
            </div>
          )}
        </div>

        {/* PROGRAMA DE INDICAÇÃO (2026-07-16) — seção própria, em evidência
            (pedido explícito do Leonardo: "deixa bem aparecido"), não mais
            escondida dentro do card de Plano. Só libera pra quem já pagou
            algum plano ("qualquer pessoa que já pagou consegue indicar") —
            free vê uma prévia bloqueada, o que também empurra upgrade. */}
        {planTier !== "free" ? (
          <div className="rounded-[2rem] border-2 border-accent bg-gradient-to-br from-accent/10 via-card to-card p-6 shadow-xl shadow-accent/10">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-black uppercase tracking-wider text-white">Indique e ganhe</span>
            </div>
            <h2 className="mt-3 text-2xl font-black text-ink">Ganhe +3 bio sites pra cada pessoa que você trouxer</h2>
            <p className="mt-2 text-sm text-muted">
              Compartilhe seu link pessoal. Quando alguém se cadastra por ele e assina <strong className="text-ink">qualquer plano</strong> do Toqy, você ganha <strong className="text-accent">+3 bio sites</strong> no seu painel — de vez, sem limite de quantas vezes.
            </p>
            {referralLink ? (
              <>
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-accent/30 bg-card px-4 py-3">
                  <span className="flex-1 truncate text-sm font-black text-ink">{referralLink}</span>
                  <button type="button" onClick={copyReferralLink} className="shrink-0 rounded-xl bg-accent px-4 py-2 text-xs font-black text-white hover:bg-accent-dim">
                    {copiedReferral ? "Copiado!" : "Copiar link"}
                  </button>
                </div>
                <p className="mt-3 text-sm font-bold text-ink">
                  {referralCount > 0
                    ? `🎉 ${referralCount} indicação${referralCount > 1 ? "ões" : ""} convertida${referralCount > 1 ? "s" : ""} · +${(profile?.referral_bonus_biosites ?? 0)} bio sites de bônus já garantidos`
                    : "Ainda sem indicações convertidas — assim que alguém pagar pelo seu link, os bio sites caem automaticamente aqui."}
                </p>
              </>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border bg-surface p-6 text-center">
            <p className="font-black text-ink">🔒 Indique e ganhe bio sites extras</p>
            <p className="mt-1 text-sm text-muted">Disponível a partir do plano Essencial — assine e ganhe seu link pessoal de indicação.</p>
            <Link href="/#planos" className="mt-4 inline-flex rounded-2xl bg-accent px-5 py-2.5 text-sm font-black text-white hover:bg-accent-dim">Ver planos</Link>
          </div>
        )}

        {/* AÇÕES */}
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-ink">Conta</h2>
          <div className="space-y-3">
            <Link href="/app" className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 hover:border-accent">
              <span className="text-sm font-black text-ink">Meus bio sites</span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
            <Link href="/onboarding" className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 hover:border-accent">
              <span className="text-sm font-black text-ink">Criar bio site para cliente</span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
            <button onClick={signOut} className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 hover:bg-red-100">
              <span className="text-sm font-black text-red-600">Sair da conta</span>
              <LogOut className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* LEGAL */}
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-xl font-black text-ink">Legal</h2>
          <div className="flex flex-wrap gap-3 text-sm font-bold text-muted">
            <Link href="/termos" className="hover:text-accent">Termos de Uso</Link>
            <span>·</span>
            <Link href="/privacidade" className="hover:text-accent">Privacidade</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-accent">Cookies</Link>
            <span>·</span>
            <Link href="/contrato-assinatura" className="hover:text-accent">Contrato de Assinatura</Link>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
