"use client";

import { useEffect, useState } from "react";
import { Inbox, Mail, MessageSquare, Phone } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { listBiositesFromSupabase } from "@/lib/biositeSync";
import { supabase } from "@/lib/supabaseClient";
import type { ToqySite } from "@/lib/types";

// Cadastros dos formulários de contato dos bio sites (2026-09-07,
// referência Coonexta — vídeo do Leonardo: "Cadastros deste site"). Um
// bio site só produz linhas aqui se o dono ligar o bloco "Formulário de
// captura de contato" (ver SiteBuilder.tsx, "leadForm"). RLS
// (toqy_leads_owner_read) já restringe a consulta aos leads dos bio
// sites do usuário logado — o filtro por site.id abaixo é só pra
// organizar a exibição por página, não é a fronteira de segurança.
type Lead = {
  id: string;
  bio_site_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: string;
};

export default function LeadsPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [leadsBySite, setLeadsBySite] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const mySites = await listBiositesFromSupabase();
      if (!active) return;
      setSites(mySites);

      const { data } = await supabase
        .from("toqy_leads")
        .select("id, bio_site_id, name, email, phone, message, created_at")
        .order("created_at", { ascending: false });
      if (!active) return;

      const grouped: Record<string, Lead[]> = {};
      for (const lead of (data ?? []) as Lead[]) {
        (grouped[lead.bio_site_id] ??= []).push(lead);
      }
      setLeadsBySite(grouped);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const totalLeads = Object.values(leadsBySite).reduce((sum, list) => sum + list.length, 0);

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Cadastros</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl text-ink">Contatos recebidos</h1>
        <p className="mt-2 max-w-2xl text-muted">Nome, e-mail e telefone de quem preencheu o formulário de contato do seu bio site. Ative o bloco em cada bio site na etapa Links e Botões.</p>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando...</p>
      ) : totalLeads === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-border p-10 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm font-bold text-muted">Nenhum contato recebido ainda.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {sites.filter((site) => leadsBySite[site.id]?.length).map((site) => (
            <section key={site.id}>
              <h2 className="text-lg font-black text-ink">{site.profile.name} <span className="font-semibold text-muted">— /{site.slug}</span></h2>
              <div className="mt-3 space-y-2">
                {leadsBySite[site.id].map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-ink">{lead.name}</p>
                      <p className="text-xs font-semibold text-muted">{new Date(lead.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
                      {lead.email ? <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{lead.email}</span> : null}
                      {lead.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{lead.phone}</span> : null}
                    </div>
                    {lead.message ? <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-ink"><MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />{lead.message}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
