'use client';

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Reconciliação de plano pendente (2026-09-01) — movida pra
// /api/plans/reconcile (service role) na mesma auditoria que travou
// plan_toqy/biosites_limit/etc em `profiles` pra escrita só via service_role
// (ver migration protect_profile_plan_columns em supabase/). Este componente
// não escreve mais essas colunas direto — só avisa o servidor "confere se
// tenho algo pendente pro meu e-mail" e o servidor decide.
async function reconcilePendingPlan(accessToken: string) {
  try {
    await fetch("/api/plans/reconcile", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Best-effort — se falhar, tenta de novo no próximo login/refresh.
  }
}

async function ensureProfile(session: { user: { id: string }; access_token: string }) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  // Perfil novo: handle_new_user() (trigger SECURITY DEFINER em auth.users,
  // ver supabase/schema.sql) já cria a linha automaticamente no signup,
  // aplicando plano pendente com privilégio de servidor — não é preciso
  // inserir nada aqui. Isso só roda como rede de segurança pra uma corrida
  // rara (client lê antes do trigger commitar); não escreve plano nenhum.
  if (!existing) {
    await supabase.from("profiles").upsert({ id: session.user.id }, { onConflict: "id", ignoreDuplicates: true });
  }

  await reconcilePendingPlan(session.access_token);
}

export function AuthSync() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        document.cookie = `toqy-session=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax; Secure`;
        ensureProfile(session);
      } else {
        document.cookie = `toqy-session=; path=/; max-age=0; SameSite=Lax; Secure`;
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        document.cookie = `toqy-session=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax; Secure`;
        if (event === "SIGNED_IN") ensureProfile(session);
      } else {
        document.cookie = `toqy-session=; path=/; max-age=0; SameSite=Lax; Secure`;
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  return null;
}
