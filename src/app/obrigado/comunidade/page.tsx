import Link from "next/link";
export const metadata = { title: "Bem-vindo à Comunidade TOQY!" };
export default function ObrigadoComunidade() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0d1117] px-5 text-center text-white">
      <img src="/brand/logo-toqy-horizontal-white.png" alt="TOQY" className="mb-10 h-10 w-auto" />
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#31c4a8]/20 text-[#31c4a8]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h1 className="mt-8 text-4xl font-black tracking-tight md:text-5xl">Compra confirmada! 🎉</h1>
      <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-400">
        Seu plano <span className="font-black text-[#31c4a8]">Comunidade TOQY</span> está ativo.
        Você tem acesso a <strong className="text-white">20 bio sites</strong>, catálogo, Pix, Wi-Fi e QR Code personalizado.
      </p>
      <div className="mt-10 w-full max-w-md rounded-[2rem] border border-indigo-500/30 bg-indigo-950/60 p-8 backdrop-blur">
        <div className="flex items-center justify-center gap-3">
          <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          <h2 className="text-xl font-black text-indigo-300">Entre na comunidade</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-indigo-200/70">Servidor exclusivo no Discord — tire duvidas, receba novidades e conecte-se com outros membros.</p>
        <a href="https://discord.gg/EsjFsRVyCC" target="_blank" rel="noopener noreferrer"
          className="mt-6 block w-full rounded-2xl bg-indigo-600 py-4 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-indigo-500">
          Entrar no Discord agora
        </a>
      </div>
      <div className="mt-6 w-full max-w-md rounded-[2rem] border border-[#31c4a8]/20 bg-[#31c4a8]/10 p-6">
        <p className="font-black text-[#31c4a8]">Proximo passo</p>
        <p className="mt-1 text-sm text-slate-400">Crie seu primeiro bio site profissional agora mesmo.</p>
        <Link href="/app/novo" className="mt-4 block w-full rounded-2xl bg-[#31c4a8] py-4 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
          Criar meu primeiro bio site
        </Link>
      </div>
      <p className="mt-10 text-xs text-slate-600">Duvidas? Fale no Discord ou envie um e-mail para leonardomarusso1@gmail.com</p>
    </main>
  );
}
