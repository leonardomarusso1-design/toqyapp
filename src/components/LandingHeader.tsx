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
      <div className="h-8 w-20 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-8 w-28 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );

  if (user) return (
    <div className="flex items-center gap-3">
      <Link href="/app" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#31c4a8] hover:text-[#1f9f87]">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#31c4a8] text-xs font-black text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
        <span className="hidden sm:inline text-[#31c4a8]">→ Painel</span>
      </Link>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="hidden text-sm font-black text-slate-700 hover:text-[#31c4a8] sm:inline-flex transition">Entrar</Link>
      <Link href="/login" className="rounded-2xl bg-[#31c4a8] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#25b69a]">Começar grátis</Link>
    </div>
  );
}
