'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setMessage(`Erro: ${error.message}`);
    } else {
      setMessage('Sucesso! Verifique sua caixa de entrada para acessar o app.');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f5fbf9] px-5 py-16 text-slate-950">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black">Entrar no Toqy</h1>
        <p className="mt-3 text-slate-600">Digite o e-mail usado na compra e receba um link mágico para entrar direto no app.</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-black text-slate-800">E-mail da compra Kiwify</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100"
              placeholder="seu-email@dominio.com"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#25b69a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Receber Link de Acesso'}
          </button>

          {message ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">{message}</p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
