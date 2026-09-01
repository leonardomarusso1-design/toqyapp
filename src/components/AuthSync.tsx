'use client';

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

async function ensureProfile(session: { user: { id: string; email?: string; user_metadata?: Record<string, string> }; access_token: string; expires_in: number }) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (existing) {
    // Reconcilia plano pendente pra conta que JÁ existia antes da compra
    // (2026-09-01 — achado investigando um caso real de cliente que pagou e
    // continuou no Grátis). Antes desta mudança, toqy_pending_plans só era
    // lido no bloco "!existing" abaixo — ou seja, só ajudava gente criando
    // conta pela primeira vez DEPOIS de pagar. Quem já tinha conta (ex: veio
    // do teste grátis) e o webhook da Kiwify não achou o profile dela na hora
    // da compra (e-mail com diferença de maiúscula/espaço, corrida entre
    // webhook e criação de conta, etc.) ficava com o plano pago represado em
    // toqy_pending_plans pra sempre, sem nada rodar de novo pra aplicar.
    // Roda em todo login — idempotente (some quando não há pendência).
    const email = session.user.email ?? "";
    if (email) {
      const { data: pending } = await supabase
        .from("toqy_pending_plans")
        .select("plan_toqy, biosites_limit")
        .eq("email", email)
        .maybeSingle();
      if (pending) {
        await supabase.from("profiles").update({
          plan_toqy: pending.plan_toqy,
          biosites_limit: pending.biosites_limit,
          plan_toqy_since: new Date().toISOString(),
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        }).eq("id", session.user.id);
        await supabase.from("toqy_pending_plans").delete().eq("email", email);
      }
    }
    return;
  }

  if (!existing) {
    const meta = session.user.user_metadata ?? {};
    const email = session.user.email ?? "";

    // Verifica plano pendente (compra feita antes de criar conta)
    let plan = "free";
    let limit = 1;
    if (email) {
      const { data: pending } = await supabase
        .from("toqy_pending_plans")
        .select("plan_toqy, biosites_limit")
        .eq("email", email)
        .maybeSingle();
      if (pending) {
        plan = pending.plan_toqy;
        limit = pending.biosites_limit;
      }
    }

    await supabase.from("profiles").insert({
      id: session.user.id,
      email,
      full_name: meta.full_name || meta.name || "",
      plan_tier: "free",
      plan_toqy: plan,
      biosites_limit: limit,
      subscription_status: "active",
    });

    // Remove o plano pendente após aplicar
    if (plan !== "free" && email) {
      await supabase.from("toqy_pending_plans").delete().eq("email", email);
    }
  }
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
