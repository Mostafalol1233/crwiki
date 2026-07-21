import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, MessageSquare } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useLocation } from "wouter";
import PageSEO from "@/components/PageSEO";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_EN = [
  "What are the best weapons for beginners?",
  "How do I rank up fast in CrossFire?",
  "What is the difference between ZP and GP?",
  "How do I report a hacker?",
  "What mercenaries are available?",
  "How does the Black Market work?",
];

const SUGGESTED_AR = [
  "إيه أحسن أسلحة للمبتدئين؟",
  "إزاي أرفع رتبتي بسرعة في CrossFire؟",
  "إيه الفرق بين ZP وGP؟",
  "إزاي أبلغ عن هاكر؟",
  "إيه المرتزقة المتاحة في اللعبة؟",
  "إزاي بيشتغل الـ Black Market؟",
];

export default function AIAssistant() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;
    setInput("");
    setError(null);
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Request failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const reset = () => { setMessages([]); setError(null); setInput(""); };

  const suggested = isAr ? SUGGESTED_AR : SUGGESTED_EN;

  return (
    <>
      <PageSEO
        title={isAr ? "مساعد الذكاء الاصطناعي — CrossFire Wiki" : "AI Assistant — CrossFire Wiki"}
        description={isAr ? "اسأل مساعد الذكاء الاصطناعي عن CrossFire — أسلحة، مرتزقة، رتب، وأكتر." : "Ask our AI assistant anything about CrossFire — weapons, mercenaries, ranks, and more."}
        canonicalPath="/ai"
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        {/* Hero */}
        <div className="relative py-16 text-center overflow-hidden" style={{ background: "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--background)) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,166,35,0.06) 0%, transparent 70%)" }} />
          <div className="relative container mx-auto px-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>
                {isAr ? "مساعد ذكي" : "AI Powered"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3" style={{ color: "var(--foreground)" }}>
              {isAr ? (
                <>مساعد <span style={{ color: "#f5a623" }}>CrossFire</span></>
              ) : (
                <>CrossFire <span style={{ color: "#f5a623" }}>AI</span></>
              )}
            </h1>
            <p className="text-sm" style={{ color: "#666" }}>
              {isAr
                ? "اسأل أي سؤال عن اللعبة — هنرد عليك على طول!"
                : "Ask anything about CrossFire — weapons, tactics, ranks, and more."}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Chat window */}
          <div style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 480 }}>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ minHeight: 360, maxHeight: 520 }}>
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "50%", border: "1px solid rgba(245,166,35,0.2)" }}>
                    <Bot className="h-7 w-7" style={{ color: "#f5a623" }} />
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>
                    {isAr ? "مرحبًا! أنا مساعد CrossFire Wiki" : "Hi! I'm the CrossFire Wiki Assistant"}
                  </p>
                  <p className="text-xs mb-6" style={{ color: "#555" }}>
                    {isAr ? "اسألني عن أي حاجة في اللعبة" : "Ask me anything about the game"}
                  </p>
                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggested.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s)}
                        className="text-[11px] px-3 py-1.5 transition-all hover:brightness-110"
                        dir={isAr ? "rtl" : "ltr"}
                        style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 3, color: "#f5a623", cursor: "pointer" }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(245,166,35,0.12)", borderRadius: "50%", border: "1px solid rgba(245,166,35,0.25)" }}>
                      <Bot className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] text-sm whitespace-pre-wrap leading-relaxed px-4 py-3"
                    dir="auto"
                    style={{
                      background: msg.role === "user" ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
                      border: msg.role === "user" ? "1px solid rgba(245,166,35,0.25)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      color: msg.role === "user" ? "#f5d97a" : "var(--foreground)",
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(255,255,255,0.06)", borderRadius: "50%" }}>
                      <User className="h-3.5 w-3.5" style={{ color: "#888" }} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(245,166,35,0.12)", borderRadius: "50%", border: "1px solid rgba(245,166,35,0.25)" }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                  </div>
                  <div className="px-4 py-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px 12px 12px 2px" }}>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#f5a623" }} />
                    <span className="text-xs" style={{ color: "#555" }}>{isAr ? "بفكر..." : "Thinking..."}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center py-3">
                  <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px" }}>
              {messages.length > 0 && (
                <div className="flex justify-end mb-2">
                  <button onClick={reset} className="flex items-center gap-1.5 text-[11px] transition-opacity hover:opacity-100" style={{ color: "#555", opacity: 0.7, background: "none", border: "none", cursor: "pointer" }}>
                    <RefreshCw className="h-3 w-3" />
                    {isAr ? "محادثة جديدة" : "New chat"}
                  </button>
                </div>
              )}
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                  }}
                  placeholder={isAr ? "اسأل عن CrossFire..." : "Ask about CrossFire..."}
                  dir={isAr ? "rtl" : "ltr"}
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none text-sm focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    color: "var(--foreground)",
                    padding: "10px 14px",
                    maxHeight: 120,
                    lineHeight: "1.5",
                  }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: "#f5a623", borderRadius: 6, border: "none", cursor: "pointer" }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#000" }} /> : <Send className="h-4 w-4" style={{ color: "#000" }} />}
                </button>
              </div>
              <p className="text-[10px] mt-2 text-center" style={{ color: "#333" }}>
                {isAr ? "اضغط Enter للإرسال • Shift+Enter لسطر جديد" : "Press Enter to send · Shift+Enter for new line"}
              </p>
            </div>
          </div>

          {/* Info card */}
          <div className="mt-6 p-5 flex items-start gap-4" style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.1)", borderRadius: 6 }}>
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,166,35,0.1)", borderRadius: 4 }}>
              <MessageSquare className="h-4 w-4" style={{ color: "#f5a623" }} />
            </div>
            <div dir={isAr ? "rtl" : "ltr"}>
              <h3 className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>
                {isAr ? "إيه اللي يقدر يساعدني فيه؟" : "What can I help with?"}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#555" }}>
                {isAr
                  ? "أسلحة ومرتزقة ورتب وخرائط وموودات وكلانات وعملات اللعبة (ZP/GP) وحجب الحسابات والدعم الفني — كل حاجة عن CrossFire."
                  : "Weapons, mercenaries, ranks, maps, game modes, clans, ZP/GP currencies, account bans, and technical support — anything CrossFire related."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
