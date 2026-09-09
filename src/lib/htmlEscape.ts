// Escapa HTML antes de interpolar dado de usuário em e-mail/HTML gerado
// pelo servidor (2026-09-06, auditoria externa — achado original em
// api/lead/route.ts: nome cru dentro do template HTML do Resend permitia
// injetar <a>/<img>/<style> assinado pelo nosso domínio). Extraído pra cá
// em 2026-09-09 pra reuso em api/biosite-booking/route.ts (notificação de
// agendamento) sem duplicar a mesma lógica de segurança em cada rota nova.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
