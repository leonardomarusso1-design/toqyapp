'use client';

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function AuthSync() {
  useEffect(() => {
    // Sincroniza a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        document.cookie = `toqy-session=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax; Secure`;
      } else {
        document.cookie = `toqy-session=; path=/; max-age=0; SameSite=Lax; Secure`;
      }
    });

    // Escuta mudanças de estado do Supabase Auth e atualiza os cookies correspondentes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        document.cookie = `toqy-session=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax; Secure`;
      } else {
        document.cookie = `toqy-session=; path=/; max-age=0; SameSite=Lax; Secure`;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
