-- Bucket de vídeo pra capa em vídeo do bio site (2026-09-07, referência
-- Coonexta). Mesmo raciocínio de 2026-09-06_storage_buckets.sql: bucket é
-- provisionado por deploy, nunca criado por request de usuário (ver
-- assertBucketExists em videoStorage.ts). Público pelo mesmo motivo dos
-- outros dois (biosite-images, biosite-audio): é mídia exibida na página
-- pública, leitura anônima é o comportamento desejado; escrita continua
-- protegida pela ausência de policy (RLS ligado, zero policies) + só o
-- service_role escreve, de dentro de /api/upload-video, que autoriza por
-- dono da conta ou por chave de edição antes de gravar qualquer coisa.

insert into storage.buckets (id, name, public)
values
  ('biosite-video', 'biosite-video', true)
on conflict (id) do nothing;
