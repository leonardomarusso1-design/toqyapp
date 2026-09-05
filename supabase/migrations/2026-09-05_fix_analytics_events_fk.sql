-- Bug real corrigido (2026-09-05, achado ao vivo pelo Leonardo: "o analytics
-- do painel ainda nao esta funcionando... entrei em alguns biosites" e 0
-- eventos na tabela desde que a feature existe, 2026-07-16).
--
-- Causa: bio_site_id tinha FK pra toqy_biosites(id) — a chave primária REAL
-- da linha. Só que TODO o resto do app (analytics.ts ao gravar,
-- /app/analytics/page.tsx ao ler, a checagem de existência em
-- /api/analytics/track) sempre usou site_data->>'id' (o id gerado no
-- CLIENT, dentro do JSON) como identificador — os dois valores são
-- diferentes desde a criação de cada bio site. Toda tentativa de INSERT
-- violava essa FK silenciosamente (erro 23503, engolido pelo "best-effort"
-- da rota, por design pra nunca quebrar a experiência do visitante) —
-- por isso ZERO eventos gravados desde que a feature existe.
--
-- JÁ APLICADA em produção via MCP apply_migration nesta sessão, e
-- verificada com um evento real de teste (inserido e depois removido).
alter table public.toqy_analytics_events
  drop constraint if exists toqy_analytics_events_bio_site_id_fkey;
