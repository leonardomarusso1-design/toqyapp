# TOQY — notas da auditoria desta revisão

## O que foi ajustado

- Corrigida a logo no topo branco da landing usando uma versão transparente com texto escuro.
- Criadas versões transparentes da marca em `public/brand` para uso em fundo claro e fundo escuro.
- Mantido o visual base aprovado do bio site público, dashboard, editor, Pix, Wi-Fi e catálogo.
- Criados fundos de template que faltavam para salão, clínica, loja, pet shop, serviços, oficina, fotógrafo e dentista.
- Integrados os novos fundos aos templates por segmento sem remover os fundos já aprovados de barbearia, restaurante e assistência técnica.
- Corrigido o build para não depender de download externo de Google Fonts durante `next build`.
- Corrigido o `public_url` da API mock de criação para usar `/b/:slug`, que é a rota pública correta.
- Refinados links externos do bio site público com normalização de URL para Instagram, Facebook, check-in e botões do catálogo.
- Corrigido o QR Code Wi-Fi para não incluir senha quando a rede estiver como `nopass`.
- Corrigidos textos sem acento em exemplos mockados.
- Ajustado o delete no painel para também esconder bio sites mockados no localStorage.

## Arquivos novos importantes

- `public/brand/logo-toqy-horizontal-dark.png`
- `public/brand/logo-toqy-horizontal-white.png`
- `public/brand/toqy-icon-transparent.png`
- `public/brand/favicon-toqy-transparent.png`
- `public/templates/template-bg-salao.png`
- `public/templates/template-bg-clinica.png`
- `public/templates/template-bg-loja.png`
- `public/templates/template-bg-petshop.png`
- `public/templates/template-bg-servicos.png`
- `public/templates/template-bg-oficina.png`
- `public/templates/template-bg-fotografo.png`
- `public/templates/template-bg-dentista.png`

## Testes executados

```bash
npm run lint
npm run build
```

Rotas testadas localmente com status 200:

- `/`
- `/app`
- `/app/novo`
- `/app/qr`
- `/me`
- `/b/barbearia-andrian`
- `/b/pastel-da-praca`
- `/b/my-cell`
- `/editar/barbearia-andrian`

## Próxima fase recomendada

1. Subir essa versão limpa para o GitHub.
2. Publicar na Vercel.
3. Conferir a logo no topo branco e a sidebar no painel.
4. Testar criação, edição, salvar, duplicar, pausar e excluir usando localStorage.
5. Só depois criar o `dataProvider` real para Supabase.
6. Depois conectar login, upload real de imagens, planos e pagamento.
