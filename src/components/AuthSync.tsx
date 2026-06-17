'use client';

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

async function ensureProfile(session: { user: { id: string; email?: string; user_metadata?: Record<string, string> }; access_token: string; expires_in: number }) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

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
