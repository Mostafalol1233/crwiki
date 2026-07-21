import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, MessageSquare } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_EN = [
  "What are the best weapons for beginners?",
  "How do I rank up fast in CrossFire?",
  "What is the difference between ZP and GP?",
  "Compare AK-47 vs M4A1 in a table",
  "What mercenaries are available?",
  "How does the Black Market work?",
];

const SUGGESTED_AR = [
  "إيه أحسن أسلحة للمبتدئين؟",
  "إزاي أرفع رتبتي بسرعة في CrossFire؟",
  "إيه الفرق بين ZP وGP؟",
  "قارن بين AK-47 وM4A1 في جدول",
  "إيه المرتزقة المتاحة في اللعبة؟",
  "إزاي بيشتغل الـ Black Market؟",
];

// Custom markdown components styled for the dark theme
const mdComponents: any = {
  p: ({ children }: any) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong style={{ color: "#f5d97a", fontWeight: 700 }}>{children}</strong>
  ),
  em: ({ children }: any) => (
    <em style={{ color: "#ccc", fontStyle: "italic" }}>{children}</em>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-base font-black mb-2 mt-3 first:mt-0" style={{ color: "#f5a623" }}>{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-sm font-bold mb-1.5 mt-3 first:mt-0" style={{ color: "#f5a623" }}>{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-xs font-bold mb-1 mt-2 first:mt-0" style={{ color: "#e0c87a" }}>{children}</h3>
  ),
  ul: ({ children }: any) => (
    <ul className="mb-2 space-y-0.5 pl-4" style={{ listStyleType: "disc" }}>{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="mb-2 space-y-0.5 pl-4" style={{ listStyleType: "decimal" }}>{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: "rgba(245,166,35,0.15)", color: "#f5d97a" }}>
        {children}
      </code>
    ) : (
      <pre className="rounded p-3 my-2 overflow-x-auto text-xs font-mono" style={{ background: "rgba(0,0,0,0.4)", color: "#ccc", border: "1px solid rgba(255,255,255,0.08)" }}>
        <code>{children}</code>
      </pre>
    ),
  blockquote: ({ children }: any) => (
    <blockquote className="pl-3 my-2 text-sm italic" style={{ borderLeft: "2px solid rgba(245,166,35,0.4)", color: "#aaa" }}>
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs border-collapse" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead style={{ background: "rgba(245,166,35,0.1)" }}>{children}</thead>
  ),
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left font-bold" style={{ color: "#f5a623", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2" style={{ color: "var(--foreground)", borderRight: "1px solid rgba(255,255,255,0.06)", opacity: 0.85 }}>
      {children}
    </td>
  ),
  img: ({ src, alt }: any) => (
    src ? (
      <img src={src} alt={alt || ""} className="rounded my-2 max-w-full" style={{ maxHeight: 300, border: "1px solid rgba(255,255,255,0.08)" }} />
    ) : null
  ),
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#f5a623", textDecoration: "underline" }}>
      {children}
    </a>
  ),
  hr: () => <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.08)" }} />,
};

export default function AIAssistant() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, loading]);

  const send = useCallback(async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;
    setInput("");
    setError(null);
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    setStreamingContent("");

    // Abort any previous request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
        signal: ctrl.signal,
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Request failed");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.error) throw new Error(chunk.error);
            if (chunk.delta) {
              fullContent += chunk.delta;
              setStreamingContent(fullContent);
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr;
          }
        }
      }

      // Commit streamed content as final message
      setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
      setStreamingContent(null);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setStreamingContent(null);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setStreamingContent(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, loading]);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput("");
    setStreamingContent(null);
    setLoading(false);
  };

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
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ minHeight: 360, maxHeight: 540 }}>
              {messages.length === 0 && !loading && (
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

              {/* Committed messages */}
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} isAr={isAr} mdComponents={mdComponents} />
              ))}

              {/* Streaming (in-progress) assistant message */}
              {(loading || streamingContent !== null) && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(245,166,35,0.12)", borderRadius: "50%", border: "1px solid rgba(245,166,35,0.25)" }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                  </div>
                  <div
                    className="max-w-[80%] text-sm leading-relaxed px-4 py-3"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px 12px 12px 2px",
                      color: "var(--foreground)",
                    }}
                  >
                    {streamingContent ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                          {streamingContent}
                        </ReactMarkdown>
                        {/* Blinking cursor */}
                        <span className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse" style={{ background: "#f5a623", verticalAlign: "middle" }} />
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#f5a623" }} />
                        <span className="text-xs" style={{ color: "#555" }}>{isAr ? "بفكر..." : "Thinking..."}</span>
                      </div>
                    )}
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
                  <Send className="h-4 w-4" style={{ color: "#000" }} />
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

function MessageBubble({ msg, isAr, mdComponents }: { msg: Message; isAr: boolean; mdComponents: any }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(245,166,35,0.12)", borderRadius: "50%", border: "1px solid rgba(245,166,35,0.25)" }}>
          <Bot className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
        </div>
      )}
      <div
        className="max-w-[80%] text-sm leading-relaxed px-4 py-3"
        dir="auto"
        style={{
          background: isUser ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
          border: isUser ? "1px solid rgba(245,166,35,0.25)" : "1px solid rgba(255,255,255,0.06)",
          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          color: isUser ? "#f5d97a" : "var(--foreground)",
        }}
      >
        {isUser ? (
          msg.content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(255,255,255,0.06)", borderRadius: "50%" }}>
          <User className="h-3.5 w-3.5" style={{ color: "#888" }} />
        </div>
      )}
    </div>
  );
}
