import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageSEO from "@/components/PageSEO";
import { useLocation } from "wouter";

function getWsUrl() {
  const api = import.meta.env.VITE_API_URL || "";
  if (!api) return "/ws";
  try {
    const u = new URL(api);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.host}/ws`;
  } catch {
    return "/ws";
  }
}

export default function Chat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const token = localStorage.getItem("userToken") || "";
  const userId = localStorage.getItem("userId") || "";
  const username = localStorage.getItem("username") || "";
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) { setLocation("/register"); return; }
    const ws = new WebSocket(`${getWsUrl()}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      const data = JSON.parse(String(ev.data || "{}"));
      if (data.type === "message/new") {
        if (data.message?.conversationId === activeId) {
          setMessages((m) => [...m, data.message]);
        }
      } else if (data.type === "typing") {
        setTypingUsers((t) => ({ ...t, [data.userId]: !!data.isTyping }));
      } else if (data.type === "read") {
        // optional UI update
      }
    };
    return () => { ws.close(); };
  }, [token, activeId]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/conversations/my", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const list = await res.json();
        setConversations(list);
        const first = list[0]?.id;
        if (first) setActiveId(first);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const res = await fetch(`/api/conversations/${activeId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMessages(await res.json());
    })();
  }, [activeId, token]);

  const sendMessage = () => {
    if (!text.trim() || !activeId) return;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message/send", conversationId: activeId, content: text, replyTo: replyTo?.id }));
      setText("");
      setReplyTo(null);
    }
  };

  const notifyTyping = (isTyping: boolean) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && activeId) {
      ws.send(JSON.stringify({ type: "typing", conversationId: activeId, isTyping }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageSEO title="Chat" description="Realtime chat" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-2">
            <div className="space-y-1">
              {conversations.map((c) => (
                <button key={c.id} className={`w-full text-left px-3 py-2 rounded ${activeId === c.id ? 'bg-muted' : ''}`} onClick={() => setActiveId(c.id)}>
                  {c.participants?.join(', ')}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`group max-w-[70%] px-3 py-2 rounded ${m.senderId === userId ? 'bg-blue-600 text-white ml-auto' : 'bg-muted'}`}>
                  {m.replyTo && (
                    <div className="text-xs opacity-80 mb-1 border-l-2 pl-2">
                      Replying to: {messages.find((x) => x.id === m.replyTo)?.content?.slice(0, 60) || ''}
                    </div>
                  )}
                  <div>{m.content}</div>
                  <div className="flex items-center justify-between text-xs opacity-70 mt-1">
                    <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                    {m.senderId === userId ? (
                      <span>{(m.readBy || []).filter((x: string) => x !== userId).length > 0 ? 'Seen' : 'Sent'}</span>
                    ) : (
                      <button className="opacity-0 group-hover:opacity-100 underline" onClick={() => setReplyTo(m)}>Reply</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {replyTo && (
              <div className="text-xs mb-2 border rounded px-2 py-1 flex items-center justify-between">
                <span>Replying to: {replyTo.content?.slice(0, 60) || ''}</span>
                <button className="underline" onClick={() => setReplyTo(null)}>Cancel</button>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Input value={text} onChange={(e) => { setText(e.target.value); notifyTyping(true); }} onBlur={() => notifyTyping(false)} placeholder={`Type a message... Mention with @${username || 'username'}`} />
              <Button onClick={sendMessage}>Send</Button>
            </div>
            {Object.keys(typingUsers).length > 0 && (<div className="text-xs mt-2">Someone is typing...</div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}