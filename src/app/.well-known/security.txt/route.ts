// RFC 9116 — canal claro pra pesquisador de segurança reportar uma
// vulnerabilidade antes de expô-la publicamente (auditoria 2026-09-01).
export async function GET() {
  const body = [
    "Contact: mailto:leonardomarusso1@gmail.com",
    "Expires: 2027-09-01T00:00:00.000Z",
    "Preferred-Languages: pt-BR, en",
    "Canonical: https://www.toqy.com.br/.well-known/security.txt",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
