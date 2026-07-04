import Link from "next/link";
export const metadata = { title: "Bem-vindo ao Plano Agencia TOQY!" };
export default function ObrigadoAgencia() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-center text-ink">
      <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="mb-10 h-10 w-auto" />
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h1 className="mt-8 text-4xl font-black tracking-tight md:text-5xl">Plano Agencia ativo! 🏆</h1>
      <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">
        Voce tem acesso a <strong className="text-ink">100 bio sites</strong>, dominio proprio, gestao de equipe, IA para criacao de conteudo e tudo do Freelancer.
      </p>
      <div className="mt-10 w-full max-w-md rounded-[2rem] border border-accent/20 bg-accent/5 p-6">
        <p className="font-black text-accent">Comecar agora</p>
        <p className="mt-1 text-sm text-muted">Gerencie bio sites dos seus clientes em escala.</p>
        <Link href="/app" className="mt-4 block w-full rounded-2xl bg-accent py-4 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-accent-dim">
          Acessar o painel
        </Link>
      </div>
      <p className="mt-10 text-xs text-muted">Suporte prioritario: leonardomarusso1@gmail.com</p>
    </main>
  );
}
