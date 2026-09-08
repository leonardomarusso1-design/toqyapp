-- Auditoria de segurança (2026-09-08) — 3 achados reais, aplicados
-- direto em produção via MCP do Supabase no momento do diagnóstico.
-- Este arquivo documenta as mudanças pro histórico de migrations.

-- ============================================================
-- 1) RISCO CRÍTICO: auto-promoção de plano de graça
-- ============================================================
-- A policy "Users can update own profile" só restringia a LINHA
-- (auth.uid() = id), sem with_check nem restrição de coluna — e a
-- tabela tinha GRANT UPDATE liberado pra authenticated (e até anon)
-- em TODAS as colunas. Qualquer usuário logado podia chamar
-- supabase.from('profiles').update({...}).eq('id', auth.uid()) com a
-- própria chave anon (exposta no bundle do client, por design) e
-- setar QUALQUER coluna da própria linha — plan_toqy, plan_tier,
-- biosites_limit, subscription_status, ai_art_credits_used,
-- overage_biosites, overage_ai_art_credits, custom_domain_addon,
-- legacy_lifetime_access — ou seja, se auto-promover pro plano
-- Agência de graça, sem pagar nada, sem passar pela Kiwify.
--
-- Fix: GRANT de UPDATE por COLUNA em vez de tabela inteira — só os 3
-- campos que o app de fato precisa que o próprio usuário edite
-- continuam editáveis (confirmado via grep: full_name/avatar_url em
-- configuracoes/page.tsx, referral_code em referral.ts). Tudo mais só
-- muda via service_role (webhook da Kiwify, rotas de servidor).
revoke insert, update, delete, truncate on public.profiles from anon;
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, referral_code) on public.profiles to authenticated;

-- ============================================================
-- 2) RISCO CRÍTICO: dump de todas as chaves Pix da plataforma
-- ============================================================
-- toqy_qr_codes tinha uma policy de SELECT pública (`using (true)`)
-- + GRANT SELECT pro role anon — qualquer requisição anônima podia
-- ler a tabela INTEIRA de uma vez: chave Pix, nome do recebedor,
-- cidade e valor de TODOS os usuários do Toqy, não só do QR Code
-- específico que alguém escaneou. A página pública /qr/[slug]
-- (StoredQrHub.tsx) filtrava por slug no client, mas isso nunca foi
-- uma fronteira de segurança — RLS avalia linha por linha, um filtro
-- no client é só otimização de query.
--
-- Fix: StoredQrHub.tsx agora busca via /api/qr-codes/public/[slug]
-- (rota de servidor nova, service_role, só 1 QR por vez, por slug).
-- Acesso público direto ao banco não existe mais.
drop policy if exists toqy_qr_codes_public_read on public.toqy_qr_codes;
revoke select on public.toqy_qr_codes from anon;

-- ============================================================
-- 3) RISCO CRÍTICO: chave de edição de qualquer bio site, em texto puro
-- ============================================================
-- toqy_biosites tinha uma policy "Public read active biosites"
-- (roles anon+authenticated, qual: status='active') que permitia
-- ler site_data CRU — incluindo editKey em texto puro — de QUALQUER
-- bio site ativo, direto via API do Supabase com a chave anon
-- pública. Confirmado ao vivo: `select site_data->>'editKey' from
-- toqy_biosites where status='active' and slug='yakisabor'` como
-- role anon devolveu a chave de edição real. Quem tivesse essa chave
-- podia editar o bio site (trocar chave Pix, WhatsApp, tirar do ar)
-- sem nunca ter feito login.
--
-- A correção de 2026-09-06 (ver src/lib/publicSite.ts) sanitizou os
-- CAMINHOS DA APLICAÇÃO, mas nunca tocou a RLS. Um caminho real da
-- própria aplicação também vazava por aqui: loadBiositeFromSupabase()
-- (src/lib/biositeSync.ts), usada por /[slug]/pix (StoredPixHub.tsx),
-- consultava esta mesma policy direto do navegador — já corrigido no
-- código pra passar por /api/biosites/[slug] (sanitizado com
-- toPublicSite()).
--
-- Fix: remove a policy pública de leitura direta da tabela. Nenhum
-- caminho da aplicação precisa mais dela. anon perde SELECT por
-- completo. authenticated mantém SELECT (necessário pra "Users can
-- read own biosites" continuar funcionando — painel/editor do dono).
drop policy if exists "Public read active biosites" on public.toqy_biosites;
revoke select on public.toqy_biosites from anon;

-- ============================================================
-- 4) Faxina: anon não tem nenhum uso legítimo de tabela nenhuma
-- ============================================================
-- Sobrava GRANT residual em anon (TRUNCATE/TRIGGER/REFERENCES em
-- praticamente toda tabela, SELECT em toqy_referrals, INSERT em
-- toqy_analytics_events). Nenhum é explorável hoje (RLS bloqueia
-- SELECT via auth.uid() nulo; toda escrita real do app — leads,
-- bookings, qr codes, analytics — já passa por rota de servidor com
-- service_role) mas são superfície de ataque sem propósito: o Toqy
-- não tem NENHUM fluxo legítimo em que o navegador, sem estar logado,
-- precise falar direto com uma tabela — client anônimo só usa
-- supabase.auth.*, que não depende de GRANT em tabela nenhuma.
revoke all on all tables in schema public from anon;
