"use client";

import { useEffect } from "react";

// Rola até a âncora certa quando a landing carrega com um #hash na URL
// (2026-09-08, bug real reportado ao vivo: "no painel ao clicar em
// ASSINAR PRO ela volta pra mesma página" — o link é só /#planos).
//
// Testado ao vivo em produção: o navegador recebe a URL com #planos
// corretamente (window.location.href mostra o hash), mas NÃO rola até
// lá (scrollY fica 0) — a landing tem mais de 10.000px de conteúdo, e o
// scroll nativo do navegador pra âncora roda ANTES do React terminar de
// montar/hidratar a página inteira, então mira numa posição que ainda
// não existe. Componente invisível (mesmo padrão de ReferralCapture.tsx
// — page.tsx é Server Component, não lê window/scroll direto): espera
// um instante pro layout assentar e tenta rolar, repetindo por até 2s
// se o elemento ainda não existir.
export function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < 20) timer = setTimeout(tryScroll, 100);
    };
    timer = setTimeout(tryScroll, 150);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
