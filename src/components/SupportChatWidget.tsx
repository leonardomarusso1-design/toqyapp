"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Chat de suporte flutuante (2026-09-08, pedido real: "hub de admin,
// com chat flutuante e no admin suporte poder responder as mensagens").
// Uma conversa por usuário (toqy_support_messages.user_id) — RLS já
// restringe cada um à própria (ver migration toqy_support_chat). Sem
// Supabase Realtime de propósito (lazy — um polling de 8s enquanto o
// painel está aberto já resolve pra um volume de suporte baixo; dá pra
// trocar por um channel de verdade depois se o volume crescer).
type Message = { id: string; sender: "user" | "admin"; message: string; created_at: string };

export function SupportChatWidget() {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Conta da última busca, pra saber se CHEGOU mensagem nova (não se é a
  // primeira carga — senão todo histórico antigo já lido apareceria como
  // "não lido" na primeira visita). Só o bolinha vermelha depende disso;
  // undefined na primeira carga = "ainda não sei o tamanho normal".
  const prevCount = useRef<number | undefined>(undefined);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id ?? null));
  }, []);

  async function loadMessages(uid: string) {
    const { data } = await supabase
      .from("toqy_support_messages")
      .select("id, sender, message, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Message[];
    setMessages(list);
    const grew = prevCount.current !== undefined && list.length > prevCount.current;
    if (grew && !openRef.current && list[list.length - 1]?.sender === "admin") setHasUnread(true);
    prevCount.current = list.length;
  }

  // Polling: a cada 8s se tiver usuário logado, mais rápido (3s) com o
  // painel aberto (resposta do admin aparece quase na hora).
  useEffect(() => {
    if (!userId) return;
    loadMessages(userId);
    const id = setInterval(() => loadMessages(userId), open ? 3000 : 8000);
    return () => clearInterval(id);
  }, [userId, open]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = draft.trim();
    if (!text || !userId || sending) return;
    setSending(true);
    setDraft("");
    const { error } = await supabase.from("toqy_support_messages").insert({ user_id: userId, sender: "user", message: text });
    if (!error) await loadMessages(userId);
    setSending(false);
  }

  if (!userId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setHasUnread(false); }}
        aria-label="Suporte"
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition hover:bg-accent-dim sm:bottom-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {hasUnread && !open ? <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-red-500" /> : null}
      </button>

      {open ? (
        <div className="fixed inset-x-4 bottom-[calc(6.5rem+4.5rem)] z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-4 sm:w-[360px]">
          <div className="border-b border-border bg-accent px-4 py-3">
            <p className="font-black text-white">Suporte TOQY</p>
            <p className="text-xs text-white/80">Geralmente respondemos rapidinho.</p>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="p-4 text-center text-xs font-semibold text-muted">Manda sua dúvida — a gente responde por aqui.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <p className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender === "user" ? "bg-accent text-white" : "bg-surface text-ink"}`}>{m.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Escreva sua mensagem..."
              className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            <button type="button" onClick={send} disabled={sending || !draft.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
