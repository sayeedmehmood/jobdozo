"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type Msg = { id: string; senderId: string; text: string; createdAt: string };

export default function MessagesPage() {
  const { loading, conversations, refresh } = useEmployerData();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  useEffect(() => {
    if (!activeId) return;
    api.get<{ messages: Msg[] }>(`/api/messages/conversations/${activeId}`).then((r) => setMessages(r.messages || []));
  }, [activeId]);

  const send = async () => {
    if (!text.trim() || !activeId) return;
    const resp = await api.post<{ message: Msg }>("/api/messages", { conversationId: activeId, text });
    setMessages((prev) => [...prev, resp.message]);
    setText("");
    refresh();
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="grid-2 messages-layout">
      <GlassCard title="Inbox">
        {conversations.map((c) => (
          <button key={c.id} type="button" className={`msg-item ${activeId === c.id ? "active" : ""}`} onClick={() => setActiveId(c.id)}>
            <strong>{c.other?.name || c.job?.title || "Candidate"}</strong>
            <small>{timeAgo(String(c.lastAt || ""))}</small>
          </button>
        ))}
      </GlassCard>
      <GlassCard title="Chat">
        {activeId ? (
          <>
            <div className="chat-box">
              {messages.map((m) => (
                <p key={m.id} className={m.senderId === user?.id ? "mine" : ""}>{m.text}</p>
              ))}
            </div>
            <div className="filter-bar">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type message..." onKeyDown={(e) => e.key === "Enter" && send()} />
              <button type="button" className="btn-primary btn-sm" onClick={send}>Send</button>
            </div>
          </>
        ) : (
          <p style={{ color: "var(--muted)" }}>Select a conversation</p>
        )}
      </GlassCard>
    </div>
  );
}
