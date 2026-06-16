'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  // Verifica se o usuário já está logado para não pedir e-mail de novo
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push('/app');
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/app` },
      });

      if (error) {
        setIsSuccess(false);
        setMessage(`Erro: ${error.message}`);
      } else {
        setIsSuccess(true);
        setMessage('Sucesso! Verifique seu e-mail para acessar o link de login.');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(`Erro inesperado: ${err.message || 'tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-sans overflow-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-100 opacity-60 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-emerald-100 opacity-60 blur-3xl"></div>

      <div className="relative w-full max-w-md">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-940 transition mb-6 group">
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          Voltar para o início
        </Link>

        {/* Elegant Card Container */}
        <div className="rounded-[2rem] border border-slate-200/60 bg-white p-8 md:p-10 shadow-xl shadow-slate-100">
          <div className="text-center">
            {/* Logo */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-5">
              <ShieldCheck className="h-7 w-7" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Entrar no Toqy</h1>
            <p className="mt-2 text-slate-500 font-medium">Digite o seu e-mail para receber um link de acesso inteligente e instantâneo.</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">E-mail de acesso</label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-450">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-250 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150 disabled:bg-slate-50 disabled:opacity-70"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center gap-2.5 rounded-2xl bg-indigo-650 hover:bg-indigo-700 py-4 px-5 text-sm font-black text-white shadow-lg shadow-indigo-150/50 transition duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Enviando link...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Receber Link de Acesso</span>
                </>
              )}
            </button>
          </form>

          {/* Toast Message Display */}
          {message && (
            <div className={`mt-6 rounded-2xl p-4 text-center text-sm font-bold leading-relaxed border ${
              isSuccess 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-red-50 border-red-105 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
