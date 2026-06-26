import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Atenção: Variáveis de ambiente do Supabase não encontradas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // salva sessão no localStorage — sobrevive ao fechar aba
    autoRefreshToken: true,      // renova o JWT automaticamente antes de expirar
    detectSessionInUrl: true,    // captura tokens de OAuth e magic link na URL
    storageKey: 'toqy-auth',     // chave única para evitar conflito com outros apps
  },
});
