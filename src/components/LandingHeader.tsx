"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function LandingHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Se tem token no hash (vindo do Google OAuth / magic link), processa e redireciona
    if (window.location.hash.includes("access_token")) {
      router.replace("/auth/confirm" + window.location.hash);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Usuário",
          email: session.user.email ?? "",
        });
      }
      setChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Usuário",
          email: session.user.email ?? "",
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!checked) return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-20 animate-pulse rounded-2xl bg-border" />
      <div className="h-8 w-28 animate-pulse rounded-2xl bg-border" />
    </div>
  );

  if (user) return (
    <div className="flex items-center gap-3">
      <Link href="/app" className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-black text-ink shadow-sm transition hover:border-accent hover:text-accent-dim">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-black text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
        <span className="hidden sm:inline text-accent">→ Painel</span>
      </Link>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="hidden text-sm font-black text-ink hover:text-accent sm:inline-flex transition">Entrar</Link>
      <Link href="/login" className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-accent-dim">Começar grátis</Link>
    </div>
  );
}
