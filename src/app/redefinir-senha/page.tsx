"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Segunda metade do fluxo de recuperação de senha (2026-09-08, ver
// src/app/login/page.tsx — modo "recover"). O link do e-mail que o
// Supabase manda (resetPasswordForEmail) traz um token no hash da URL;
// o SDK do Supabase lê esse hash sozinho ao carregar a página e dispara
// o evento PASSWORD_RECOVERY com uma sessão temporária — o suficiente
// pra chamar updateUser({ password }) uma vez, sem precisar da senha
// antiga. Não dá pra reaproveitar /auth/confirm pra isso: aquela página
// só faz getSession()/redireciona pro painel assim que existe QUALQUER
// sessão — chegando lá com uma sessão de recuperação, a pessoa cairia
// direto no /app sem nunca ver o formulário de senha nova.
function RedefinirSenhaInner() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Se a página recarregar depois do evento (ou o navegador disparar o
    // evento antes deste efeito montar), uma sessão já pode existir —
    // trata como pronto também, mesmo sem ver o PASSWORD_RECOVERY.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // Link expirado/inválido: nem evento nem sessão aparecem. Sem prazo
    // fixo pra declarar erro na hora, dá alguns segundos pro Supabase
    // processar o hash antes de mostrar "link inválido".
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) setInvalid(true);
      });
    }, 4000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(`Erro: ${updateError.message}`);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/app"), 1800);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-12 font-sans">
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-accent/10 opacity-60 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-violet/10 opacity-60 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-border/40 md:p-10">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-ink">Nova senha</h1>
          </div>

          {invalid ? (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-800">
              Este link expirou ou já foi usado. Peça um novo em
              {" "}
              <Link href="/login" className="underline underline-offset-2">Esqueci minha senha</Link>.
            </div>
          ) : done ? (
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-800">
              Senha alterada! Levando você pro painel...
            </div>
          ) : !ready ? (
            <div className="mt-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <p className="text-center text-sm font-medium text-muted">Escolha a nova senha da sua conta Toqy.</p>
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-ink">Nova senha</label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted"><Lock className="h-5 w-5" /></div>
                  <input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} disabled={loading} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:bg-surface disabled:opacity-70" />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-ink">Confirmar senha</label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted"><Lock className="h-5 w-5" /></div>
                  <input id="confirmPassword" type="password" placeholder="Digite de novo" value={confirmPassword} disabled={loading} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                    className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:bg-surface disabled:opacity-70" />
                </div>
              </div>
              {error ? <p className="text-center text-sm font-bold text-red-600">{error}</p> : null}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-accent px-5 py-4 text-sm font-black text-white shadow-lg shadow-accent/20 transition duration-200 hover:-translate-y-0.5 hover:bg-accent-dim disabled:pointer-events-none disabled:opacity-60">
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return <Suspense fallback={null}><RedefinirSenhaInner /></Suspense>;
}
