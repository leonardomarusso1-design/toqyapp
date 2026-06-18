'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Mail, ShieldCheck, Sparkles, User, Phone, IdCard } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type AuthMode = 'login' | 'signup';

type FormState = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  cpf: string;
};

const initialFormState: FormState = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  cpf: '',
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Verifica sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/app');
    });

    // Escuta mudanças — redireciona quando sessão é confirmada
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        router.push('/app');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const submitLabel = useMemo(() => {
    if (loading) {
      return mode === 'login' ? 'Entrando...' : 'Criando conta...';
    }

    return mode === 'login' ? 'Entrar na conta' : 'Criar conta';
  }, [loading, mode]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) {
          setMessage(`Erro: ${error.message}`);
          return;
        }

        setIsSuccess(true);
        router.push('/app');
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            full_name: form.fullName,
            phone: form.phone,
            cpf: form.cpf,
          },
        },
      });

      if (error) {
        setMessage(`Erro: ${error.message}`);
        return;
      }

      setIsSuccess(true);
      setMessage('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      // NÃO redirecionar — usuário precisa confirmar o email primeiro
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'tente novamente.';
      setMessage(`Erro inesperado: ${messageText}`);
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 font-sans">
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-100 opacity-60 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-emerald-100 opacity-60 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          Voltar para o início
        </Link>

        <div className="rounded-[2rem] border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-100 md:p-10">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div className="mx-auto mb-6 inline-flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage('');
                  setIsSuccess(false);
                }}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setMessage('');
                  setIsSuccess(false);
                }}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  mode === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Criar conta
              </button>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {isSignup ? 'Crie sua conta Toqy' : 'Entrar no Toqy'}
            </h1>
            <p className="mt-2 font-medium text-slate-500">
              {isSignup
                ? 'Cadastre seus dados para acessar o app com e-mail e senha.'
                : 'Entre com seu e-mail e senha para acessar sua área de trabalho.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Login com Google */}
            <button
              type="button"
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/confirm` } })}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar com Google
            </button>

            {/* Divisor */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-bold text-slate-400">ou use seu e-mail</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            {isSignup && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-slate-700">
                  Nome completo
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-450">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={form.fullName}
                    disabled={loading}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    required={isSignup}
                    className="w-full rounded-2xl border border-slate-250 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150 disabled:bg-slate-50 disabled:opacity-70"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">
                E-mail
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-450">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={form.email}
                  disabled={loading}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-250 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150 disabled:bg-slate-50 disabled:opacity-70"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                Senha
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-450">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={form.password}
                  disabled={loading}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-slate-250 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150 disabled:bg-slate-50 disabled:opacity-70"
                />
              </div>
            </div>

            {isSignup && (
              <>
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-slate-700">
                    Telefone
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-450">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={form.phone}
                      disabled={loading}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      required={isSignup}
                      className="w-full rounded-2xl border border-slate-250 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150 disabled:bg-slate-50 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cpf" className="block text-sm font-bold text-slate-700">
                    CPF
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-450">
                      <IdCard className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={form.cpf}
                      disabled={loading}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      required={isSignup}
                      className="w-full rounded-2xl border border-slate-250 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150 disabled:bg-slate-50 disabled:opacity-70"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-indigo-100/50 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{submitLabel}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{submitLabel}</span>
                </>
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-6 rounded-2xl border p-4 text-center text-sm font-bold leading-relaxed ${
              isSuccess ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-800'
            }`}>
              {message}
              {isSuccess && (
                <p className="mt-2 text-xs font-normal text-emerald-700">
                  Após confirmar, volte aqui e clique em <strong>Entrar</strong> com seu e-mail e senha.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}