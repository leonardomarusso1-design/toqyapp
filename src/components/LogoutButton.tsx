'use client';

import { supabase } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const handleLogout = async () => {
    // Executa signOut no Supabase
    await supabase.auth.signOut();
    
    // Deleta o cookie de sessão do lado do cliente
    document.cookie = "toqy-session=; path=/; max-age=0; SameSite=Lax; Secure";
    
    // Redireciona de forma robusta e limpa o estado
    window.location.href = "/";
  };

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-650 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
      title="Sair da conta"
    >
      <LogOut className="h-5 w-5" />
      <span>Sair da conta</span>
    </button>
  );
}
