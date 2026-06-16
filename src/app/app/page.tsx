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

  useEffect(() => {
    const checkUserAndPlan = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name, subscription_status, plan_tier")
        .eq("email", user.email)
        .single();

      let finalProfile: UserProfile | null = profileData;

      // Se não encontrou na primeira tentativa, aguarda e tenta novamente
      if (!profileData && profileError?.code === "PGRST116") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: retryProfileData, error: retryError } = await supabase
          .from("profiles")
          .select("email, full_name, subscription_status, plan_tier")
          .eq("email", user.email)
          .single();

        if (retryError || !retryProfileData) {
          console.error("Erro ao buscar perfil (retry):", retryError);
          alert("Não foi possível carregar seu perfil. Tente novamente mais tarde.");
          router.push("/login");
          return;
        }

        finalProfile = retryProfileData;
      } else if (profileError || !profileData) {
        console.error("Erro ao buscar perfil:", profileError);
        alert("Não foi possível carregar seu perfil. Tente novamente mais tarde.");
        router.push("/login");
        return;
      }

      if (!finalProfile || finalProfile.subscription_status !== "active") {
        if (!finalProfile) {
          alert("Não foi possível carregar seu perfil. Tente novamente mais tarde.");
          router.push("/login");
          return;
        }
        alert("Sua assinatura não está ativa. Por favor, adquira um plano.");
        router.push("/");
        return;
      }

      setProfile(finalProfile);
      setLoading(false);
    };

    checkUserAndPlan();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5fbf9] flex items-center justify-center px-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-xl font-black text-slate-900">Carregando sua área de trabalho...</p>
        </div>
      </main>
    );
  }

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
            <p className="mt-3 text-2xl font-black text-slate-900">{profile?.plan_tier}</p>
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
            <div className="rounded-[1.5rem] border border-[#31c4a8] bg-[#ecfdf6] p-6 text-slate-900">
              <p className="font-black">🚀 Painel de Criação Liberado:</p>
              <p className="mt-2">Você está no plano {profile?.plan_tier === "free" ? "Gratuito" : profile?.plan_tier}.</p>
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
