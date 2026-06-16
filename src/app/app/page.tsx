'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface UserProfile {
  email: string;
  full_name: string;
  subscription_status: string;
  plan_tier: string;
}

export default function AppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setErrorMsg('');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        setLoading(false);
        router.push('/login');
        return;
      }

      // Tenta buscar o perfil com 3 tentativas silenciosas
      let profileData = null;
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase
          .from('profiles')
          .select('email, full_name, subscription_status, plan_tier')
          .eq('email', session.user.email)
          .single();

        if (data) {
          profileData = data;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      if (!mounted) return;

      if (!profileData) {
        setErrorMsg('Não foi possível carregar seu perfil. O banco de dados ainda está processando seu cadastro.');
        setLoading(false);
        return;
      }

      if (profileData.subscription_status !== 'active') {
        alert("Sua assinatura não está ativa. Por favor, adquira um plano.");
        setLoading(false);
        router.push('/');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    loadData();

    // Escuta mudanças de sessão apenas se for um login novo
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadData();
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // TELA DE CARREGAMENTO (Seu design mantido)
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5fbf9] flex items-center justify-center px-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-xl font-black text-slate-900">Carregando sua área de trabalho...</p>
        </div>
      </main>
    );
  }

  // TELA DE ERRO (Criada com o seu padrão de design)
  if (errorMsg) {
    return (
      <main className="min-h-screen bg-[#f5fbf9] flex items-center justify-center px-5">
        <div className="rounded-[2rem] border border-red-200 bg-white p-8 shadow-sm text-center max-w-md">
          <p className="text-xl font-black text-red-600 mb-4">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-[#31c4a8] text-white rounded-full font-bold hover:bg-[#28a890] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  // TELA PRINCIPAL (Seu design mantido)
  return (
    <main className="min-h-screen bg-[#f5fbf9] px-5 py-16 text-slate-950">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-black">Bem-vindo ao Toqy App, {profile?.full_name || "Usuário"}!</h1>
        <p className="mt-4 text-slate-600">Seu e-mail de acesso: <span className="font-black">{profile?.email}</span></p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-100 bg-[#f8fbfa] p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Status da Assinatura</p>
            <p className="mt-3 text-2xl font-black text-slate-900">Ativa</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-100 bg-[#f8fbfa] p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Seu Plano Atual</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{profile?.plan_tier === "free" ? "Gratuito" : profile?.plan_tier}</p>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          {profile?.plan_tier === "Toqy - Agência" && (
            <div className="rounded-[1.5rem] border border-[#31c4a8] bg-[#ecfdf6] p-6 text-slate-900">
              <p className="font-black">🎉 Recurso Premium Agência Liberado:</p>
              <p className="mt-2">White label parcial, gestão de equipe e até 100 bio sites!</p>
            </div>
          )}

          {(profile?.plan_tier === "Toqy - Freelancer" || profile?.plan_tier === "Toqy - Agência") && (
            <div className="rounded-[1.5rem] border border-[#31c4a8] bg-[#ecfdf6] p-6 text-slate-900">
              <p className="font-black">✨ Recurso Freelancer Liberado:</p>
              <p className="mt-2">Catálogo completo, QR Code personalizado e suporte prioritário!</p>
            </div>
          )}

          {(profile?.plan_tier === "free" || profile?.plan_tier === "Toqy - Comunidade" || profile?.plan_tier === "Toqy - Freelancer" || profile?.plan_tier === "Toqy - Agência") && (
            <div className="rounded-[1.5rem] border border-[#31c4a8] bg-[#ecfdf6] p-6 text-slate-900 flex flex-col items-start">
              <p className="font-black">🚀 Painel de Criação Liberado:</p>
              <p className="mt-2 mb-4">Você está no plano {profile?.plan_tier === "free" ? "Gratuito" : profile?.plan_tier}.</p>
              <button 
                onClick={() => router.push('/app/novo')} 
                className="px-6 py-3 bg-[#31c4a8] text-white font-bold rounded-xl hover:bg-[#28a890] transition-colors"
              >
                Ir para o Criador de Bio sites
              </button>
            </div>
          )}

          {(profile?.plan_tier === "Toqy - Comunidade" || profile?.plan_tier === "Toqy - Freelancer" || profile?.plan_tier === "Toqy - Agência") && (
            <div className="rounded-[1.5rem] border border-[#31c4a8] bg-[#ecfdf6] p-6 text-slate-900">
              <p className="font-black">👥 Recurso Comunidade Liberado:</p>
              <p className="mt-2">Até 20 bio sites e acesso à comunidade exclusiva!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
