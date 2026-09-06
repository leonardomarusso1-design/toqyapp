-- Provisionamento dos buckets de Storage (2026-09-06, achado de auditoria
-- externa de segurança).
--
-- Achado: o código criava o bucket DENTRO do caminho de upload
-- (`ensureBucket()` em imageStorage.ts/audioStorage.ts) — ou seja, uma
-- requisição de usuário comum tinha o poder de criar infraestrutura.
-- Isso é responsabilidade de deploy, não de request: além do risco, fazia
-- o ambiente "se consertar sozinho" e escondia diferenças entre produção
-- e staging.
--
-- O código agora só VERIFICA a existência (`assertBucketExists()`) e falha
-- com erro claro se faltar. Esta migration é a contraparte: garante que os
-- buckets existam por deploy, de forma reprodutível em qualquer ambiente.
--
-- Estado em produção quando esta migration foi escrita (conferido via
-- MCP em 2026-09-06): `biosite-images` (criado 2026-07-07) e
-- `biosite-audio` (criado 2026-09-06) JÁ EXISTEM e são públicos. Por isso
-- o `on conflict do nothing` — aplicar isso em produção é no-op; o valor
-- está em ambientes novos (staging, dev de outro dev, disaster recovery).

insert into storage.buckets (id, name, public)
values
  ('biosite-images', 'biosite-images', true),
  ('biosite-audio', 'biosite-audio', true)
on conflict (id) do nothing;

-- Nota deliberada sobre os buckets serem públicos: são imagens/áudios
-- exibidos no bio site público, então leitura anônima é o comportamento
-- desejado (o flag `public` é justamente isso — leitura pela URL pública).
--
-- E a ESCRITA anônima? Conferido em produção via MCP em 2026-09-06:
-- `storage.objects` e `storage.buckets` estão com RLS LIGADO e com ZERO
-- policies. Em Postgres isso significa negação por padrão: nenhum papel
-- sujeito a RLS (anon/authenticated) consegue INSERT/UPDATE/DELETE. Quem
-- escreve é só o service_role, que bypassa RLS — e ele só é usado dentro
-- de /api/upload-image e /api/upload-audio, que autorizam por dono da
-- conta ou por chave de edição antes de gravar qualquer coisa.
--
-- Ou seja: a proteção de escrita hoje vem da AUSÊNCIA de policy, não de
-- uma policy explícita. Funciona, mas é frágil por ser implícito — se
-- alguém adicionar uma policy permissiva no futuro achando que "não tem
-- nada protegendo", abre o buraco. Fica registrado aqui para que a
-- decisão seja consciente.
