"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

function ConfirmInner() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // Supabase resolve automaticamente tokens do hash fragment (OAuth e magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("ok");
        setTimeout(() => router.replace("/app"), 1500);
      } else if (event === "TOKEN_REFRESHED" && session) {
        setStatus("ok");
        setTimeout(() => router.replace("/app"), 1500);
      }
    });

    // Verifica sessão já existente (ex: reload da página)
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setStatus("error");
        setMsg("Link inválido ou expirado. Faça login novamente.");
        return;
      }
      if (data.session) {
        setStatus("ok");
        setTimeout(() => router.replace("/app"), 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5fbf9] px-5 text-center">
      <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="mb-10 h-9 w-auto" />

      {status === "loading" && (
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#31c4a8] border-t-transparent" />
          <p className="mt-6 text-lg font-black text-slate-800">Confirmando seu acesso...</p>
        </div>
      )}

      {status === "ok" && (
        <div className="rounded-[2rem] border border-emerald-200 bg-white p-10 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-900">Acesso confirmado!</h1>
          <p className="mt-2 text-slate-500">Redirecionando para o seu painel...</p>
          <Link href="/app" className="mt-6 inline-flex rounded-2xl bg-[#31c4a8] px-6 py-3 text-sm font-black text-white transition hover:bg-[#25b69a]">
            Ir para o painel agora
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-[2rem] border border-red-200 bg-white p-10 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-900">Link inválido ou expirado</h1>
          <p className="mt-2 text-slate-500">{msg}</p>
          <Link href="/login" className="mt-6 inline-flex rounded-2xl bg-[#31c4a8] px-6 py-3 text-sm font-black text-white transition hover:bg-[#25b69a]">
            Fazer login
          </Link>
        </div>
      )}
    </main>
  );
}

export default function ConfirmPage() {
  return <Suspense fallback={null}><ConfirmInner /></Suspense>;
}
