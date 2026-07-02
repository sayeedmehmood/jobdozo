"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type Msg = { id: string; senderId: string; text: string; createdAt: string };

export default function MessagesPage() {
  const { loading, conversations, refresh } = useSeekerData();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [typing, setTyping] = useState(false);

  const convName = (c: (typeof conversations)[0]) => c.other?.name || c.job?.company || "Employer";
  const filtered = conversations.filter((c) =>
    !q || convName(c).toLowerCase().includes(q.toLowerCase()) || (c.lastMessage || "").toLowerCase().includes(q.toLowerCase())
  );

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  useEffect(() => {
    if (!activeId) return;
    api.get<{ messages: Msg[] }>(`/api/messages/conversations/${activeId}`).then((r) => setMessages(r.messages || []));
  }, [activeId]);

  const send = async () => {
    if (!text.trim() || !activeId) return;
    setTyping(true);
    const resp = await api.post<{ message: Msg }>("/api/messages", { conversationId: activeId, text });
    setMessages((prev) => [...prev, resp.message]);
    setText("");
    setTyping(false);
    refresh();
  };

  const active = conversations.find((c) => c.id === activeId);

  if (loading) return <PageSkeleton />;

  return (
    <GlassCard>
      <div className="filter-bar">
        <input placeholder="Search conversations..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="btn-outline btn-sm" onClick={() => alert("Video call started (demo)")}><i className="fa-solid fa-video" /> Video Call</button>
      </div>
      <div className="chat-layout">
        <div className="chat-list">
          {filtered.length ? filtered.map((c) => (
            <button key={c.id} type="button" className={`msg-row ${c.id === activeId ? "active" : ""}`} style={{ width: "100%", border: "none", background: c.id === activeId ? "#eef5ff" : "transparent", cursor: "pointer", borderRadius: 10 }} onClick={() => setActiveId(c.id)}>
              <div className="msg-mid" style={{ textAlign: "left" }}>
                <strong>{convName(c)}</strong>
                <small>{c.lastMessage || "No messages"} • {timeAgo(c.lastAt)}</small>
              </div>
              {(c.unread || 0) > 0 && <span className="pill-badge">{c.unread}</span>}
            </button>
          )) : <EmptyState title="No conversations" />}
        </div>
        <div className="chat-pane">
          <div className="chat-head">{active ? convName(active) : "Select a chat"} {typing && <small style={{ color: "var(--muted)" }}> • typing...</small>}</div>
          <div className="chat-msgs">
            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.senderId.startsWith("u-") && !m.senderId.includes("techcorp") ? "me" : "them"}`}>{m.text}</div>
            ))}
          </div>
          <div className="chat-input">
            <button type="button" className="btn-outline btn-sm" title="Attach file" onClick={() => alert("Attachment upload (demo)")}><i className="fa-solid fa-paperclip" /></button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && send()} />
            <button type="button" className="btn-primary btn-sm" onClick={send}>Send</button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
