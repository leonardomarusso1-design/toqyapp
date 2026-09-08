"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

// Painel de suporte pro admin (2026-09-08) — outro lado do
// SupportChatWidget.tsx: aqui dá pra ver TODAS as conversas (RLS via
// profiles.is_admin, ver migrations toqy_support_chat/
// fix_profiles_admin_read_recursion) e responder qualquer uma. Sem
// Supabase Realtime de propósito — mesmo polling simples do widget do
// usuário (8s parado, 3s com uma conversa aberta).
type Message = { id: string; user_id: string; sender: "user" | "admin"; message: string; created_at: string };
type Profile = { id: string; full_name: string | null; email: string | null };

type Conversation = { userId: string; name: string; lastMessage: string; lastAt: string; unread: boolean };

export default function AdminSuportePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).maybeSingle();
      setIsAdmin(Boolean(profile?.is_admin));
      setChecking(false);
    })();
  }, [router]);

  async function loadAll() {
    const [{ data: msgs }, { data: allProfiles }] = await Promise.all([
      supabase.from("toqy_support_messages").select("id, user_id, sender, message, created_at").order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    setMessages((msgs ?? []) as Message[]);
    const byId: Record<string, Profile> = {};
    for (const p of (allProfiles ?? []) as Profile[]) byId[p.id] = p;
    setProfiles(byId);
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
    const id = setInterval(loadAll, selectedUserId ? 3000 : 8000);
    return () => clearInterval(id);
  }, [isAdmin, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, selectedUserId]);

  const conversations: Conversation[] = (() => {
    const byUser = new Map<string, Message[]>();
    for (const m of messages) (byUser.get(m.user_id) ?? byUser.set(m.user_id, []).get(m.user_id)!).push(m);
    return [...byUser.entries()]
      .map(([userId, list]) => {
        const last = list[list.length - 1];
        const profile = profiles[userId];
        return {
          userId,
          name: profile?.full_name?.trim() || profile?.email || userId.slice(0, 8),
          lastMessage: last.message,
          lastAt: last.created_at,
          unread: last.sender === "user",
        };
      })
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  })();

  const thread = selectedUserId ? messages.filter((m) => m.user_id === selectedUserId) : [];

  async function send() {
    const text = draft.trim();
    if (!text || !selectedUserId || sending) return;
    setSending(true);
    setDraft("");
    const { error } = await supabase.from("toqy_support_messages").insert({ user_id: selectedUserId, sender: "admin", message: text });
    if (!error) await loadAll();
    setSending(false);
  }

  if (checking) return <DashboardShell><p className="mt-10 text-center text-sm font-bold text-muted">Carregando...</p></DashboardShell>;
  if (!isAdmin) return <DashboardShell><p className="mt-10 text-center text-sm font-bold text-muted">Não disponível.</p></DashboardShell>;

  return (
    <DashboardShell>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Admin</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight text-ink md:text-4xl">Suporte</h1>
      <p className="mt-2 text-sm text-muted">Conversas de todos os usuários do Toqy, mais recentes primeiro.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">Nenhuma conversa ainda.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.userId}
                type="button"
                onClick={() => setSelectedUserId(c.userId)}
                className={`flex w-full flex-col gap-0.5 rounded-2xl border p-3 text-left transition ${selectedUserId === c.userId ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/40"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-black text-ink">{c.name}</span>
                  {c.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" /> : null}
                </span>
                <span className="truncate text-xs text-muted">{c.lastMessage}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex min-h-[400px] flex-col rounded-[2rem] border border-border bg-card shadow-sm">
          {!selectedUserId ? (
            <p className="m-auto text-sm font-bold text-muted">Escolha uma conversa ao lado.</p>
          ) : (
            <>
              <div className="border-b border-border p-4">
                <p className="font-black text-ink">{profiles[selectedUserId]?.full_name || profiles[selectedUserId]?.email || selectedUserId}</p>
                <p className="text-xs text-muted">{profiles[selectedUserId]?.email}</p>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
                {thread.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <p className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender === "admin" ? "bg-accent text-white" : "bg-surface text-ink"}`}>{m.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-border p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                  placeholder="Responder..."
                  className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                />
                <button type="button" onClick={send} disabled={sending || !draft.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
