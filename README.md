# TOQY

Plataforma MVP de bio sites/cartões digitais para QR Code, NFC e plaquinhas físicas.

## Rotas principais

- `/` — landing pública
- `/app` — painel admin/aluno
- `/app/novo` — criador completo com preview ao vivo
- `/app/qr` — QR Codes dos bio sites
- `/me` — área do cliente final com chave de acesso
- `/b/:slug` — bio site público
- `/editar/:slug` — editor com chave

## Demo

- `/b/barbearia-andrian` — chave `8392-1147`
- `/b/pastel-da-praca` — chave `2222-3333`
- `/b/my-cell` — chave `4444-5555`

## Rodar local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run lint
```

## Observação

Este MVP usa `localStorage` como banco temporário. A arquitetura está preparada para futura troca por Supabase, autenticação real, upload real e planos/assinaturas.
