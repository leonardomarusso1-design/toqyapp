// ROTAS REMOVIDAS (2026-09-06) — as duas eram código morto e as duas
// eram falhas de segurança sérias. Nada no app chamava nenhuma delas
// (conferido com busca em todo o `src/`); o caminho real de criação é
// POST /api/sites/create e o de leitura é GET /api/biosites/[slug].
//
// GET (listagem) — VAZAMENTO EM MASSA
// Fazia `select("*")` em TODOS os bio sites, sem autenticação nenhuma, e
// devolvia `{ ...r.site_data }` cru. Como `site_data` guarda `editKey`
// em texto puro, uma única requisição sem login entregava a chave de
// edição dos 57 bio sites da plataforma de uma vez — cada uma dando
// acesso total ao site daquele cliente, inclusive pra trocar a chave Pix.
//
// POST (criação) — SEM AUTENTICAÇÃO E SEM DONO
// Inseria em `toqy_biosites` com service role, sem checar sessão, sem
// gravar `owner_profile_id` e usando `edit_key_hash: site.editKey` vindo
// direto do corpo da requisição. Qualquer um podia criar bio sites em
// massa, ocupar slugs de terceiros (ex: o nome de uma marca) e definir a
// própria chave de edição. Sites criados assim ficariam órfãos, sem dono
// nenhum, já que `owner_profile_id` nunca era preenchido.
//
// Este arquivo é mantido só com esta explicação para que o motivo da
// remoção fique versionado — se alguém precisar de uma listagem
// administrativa no futuro, ela tem que nascer autenticada, restrita ao
// dono (ou a um papel de admin) e passando por `toPublicSite()`.
export {};
