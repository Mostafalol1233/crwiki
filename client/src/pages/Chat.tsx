import { useEffect, useRef, useState } from "react";
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

function getApiUrl(path: string) {
  const api = import.meta.env.VITE_API_URL || "";
  if (!api) return path;
  try {
    const u = new URL(api);
    return new URL(path, `${u.protocol}//${u.host}`).toString();
  } catch {
    return path;
  }
}

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const userId = localStorage.getItem("userId") || "";
  const username = localStorage.getItem("username") || "";
  const [, setLocation] = useLocation();
  const [replyTo, setReplyTo] = useState<string>("");

  useEffect(() => {
    if (!username) { setLocation("/register"); return; }
    fetch(getApiUrl("/api/chat/messages?limit=50")).then(async (r) => {
      const arr = await r.json();
      setMessages(arr || []);
    }).catch(() => {});
    let retry = 0;
    let closed = false;
    const connect = () => {
      if (closed) return;
      const ws = new WebSocket(`${getWsUrl()}?username=${encodeURIComponent(username)}`);
      wsRef.current = ws;
      ws.onopen = () => { retry = 0; };
      ws.onmessage = (ev) => {
        const data = JSON.parse(String(ev.data || "{}"));
        if (data.type === "presence") setOnlineUsers(Array.isArray(data.users) ? data.users : []);
        else if (data.type === "message") setMessages((m) => [...m, { id: crypto.randomUUID?.() || String(Date.now()), sender: data.from, content: data.text, createdAt: Date.now() }]);
      };
      const schedule = () => {
        retry = Math.min(retry + 1, 5);
        const delay = Math.min(1000 * Math.pow(2, retry), 10000);
        setTimeout(() => connect(), delay);
      };
      ws.onerror = () => schedule();
      ws.onclose = () => schedule();
    };
    connect();
    return () => { closed = true; wsRef.current?.close(); };
  }, [username]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const body = { sender: username, text, replyTo: replyTo || undefined };
    fetch(getApiUrl("/api/chat/messages"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(async (r) => {
      const saved = await r.json();
      if (saved && saved.id) {
        setMessages((m) => [...m, saved]);
        setText("");
        setReplyTo("");
      }
    }).catch(() => {});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageSEO title="Chat" description="Realtime chat" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 shadow-none border">
          <CardContent className="p-2">
            <div className="text-xs mb-2">Online</div>
            <div className="space-y-1">
              {onlineUsers.map((u) => (
                <div key={u} className="px-3 py-2 rounded bg-white border flex items-center justify-between">
                  <span className="text-sm">{u}</span>
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-3 shadow-none border">
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[70%] px-4 py-2 rounded ${m.sender === username ? 'bg-blue-500 text-white ml-auto' : 'bg-white text-black border'}`}>
                  <div className="text-xs opacity-80 mb-1">{m.sender}</div>
                  {m.replyTo && (
                    <div className="text-xs opacity-70 mb-1">Replying to {m.replyTo}</div>
                  )}
                  <div className="leading-relaxed">{m.content || m.text}</div>
                  <div className="flex items-center justify-between text-xs opacity-70 mt-1">
                    <span>{new Date(m.createdAt || Date.now()).toLocaleTimeString()}</span>
                    <button className="underline" onClick={() => setReplyTo(m.id)}>Reply</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={replyTo ? `Replying...` : `Type a message...`} />
              <Button onClick={sendMessage}>Send</Button>
              {replyTo && <Button variant="outline" onClick={() => setReplyTo("")}>Cancel</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}