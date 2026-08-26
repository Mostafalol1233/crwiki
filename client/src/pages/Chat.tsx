import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PageSEO from "@/components/PageSEO";
import { useLocation } from "wouter";
import { Send, Image as ImageIcon, Plus, Users, Hash, MoreVertical, Phone, Video, Settings, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { apiRequest } from "@/lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  name?: string;
  type: "direct" | "group" | "channel";
  avatar?: string;
  participants: string[];
  last_message?: string;
  last_message_at?: string;
  created_at?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_username: string;
  content: string;
  type?: "text" | "image" | "system";
  reply_to_id?: string;
  reply_to_content?: string;
  reply_to_sender?: string;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Chat() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Auth
  const [username, setUsername] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState("");
  const [myAvatar, setMyAvatar] = useState("");
  const [authReady, setAuthReady] = useState(false);

  // Data
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // UI state
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newDMUser, setNewDMUser] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Step 1: resolve auth from Supabase session ────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      const session = result?.data?.session;
      if (!session) {
        sessionStorage.setItem("authRedirectMsg", "You must be signed in to access Chat.");
        setLocation("/login");
        return;
      }
      const uname = session.user.user_metadata?.username
        || session.user.email?.split("@")[0]
        || session.user.id.slice(0, 12);
      const displayName = session.user.user_metadata?.displayName
        || session.user.user_metadata?.username
        || uname;
      const avatar = session.user.user_metadata?.avatar
        || session.user.user_metadata?.avatar_url
        || "";
      setUsername(uname);
      setMyDisplayName(displayName);
      setMyAvatar(avatar);
      setAuthReady(true);
    });
  }, [setLocation]);

  // DB migration needed flag
  const [needsMigration, setNeedsMigration] = useState(false);

  // ── Step 2: load conversations once auth is ready ─────────────────────────
  useEffect(() => {
    if (!authReady || !username) return;
    fetchConversations();
  }, [authReady, username]);

  const fetchConversations = useCallback(async () => {
    if (!username) return;
    try {
      const data = await apiRequest('/api/sitemap?type=community', 'POST', { action: 'chat:conversations:list' });
      setNeedsMigration(false);
      setConversations(Array.isArray(data) ? data as Conversation[] : []);
    } catch (error: any) {
      if (String(error?.message || '').toLowerCase().includes('conversation')) setNeedsMigration(true);
      else console.error('fetchConversations:', error?.message || error);
    }
  }, [username]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await apiRequest('/api/sitemap?type=community', 'POST', { action: 'chat:messages:list', conversationId });
      setMessages(Array.isArray(data) ? data as Message[] : []);
    } catch (error) {
      console.error('fetchMessages:', error);
      setMessages([]);
    }
  }, []);

  // ── Step 3: load messages and refresh private chat data ─────────────────────
  useEffect(() => {
    if (!authReady || !username) return;
    fetchConversations();
    if (activeConvId) fetchMessages(activeConvId);
    const timer = window.setInterval(() => {
      fetchConversations();
      if (activeConvId) fetchMessages(activeConvId);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [authReady, username, activeConvId, fetchConversations, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string, type: "text" | "image" = "text") => {
    if (!activeConvId || !username || !content.trim()) return;
    try {
      const inserted = await apiRequest('/api/sitemap?type=community', 'POST', {
        action: 'chat:message:create',
        conversationId: activeConvId,
        content: content.trim(),
        type,
        ...(replyingTo ? {
          reply_to_id: replyingTo.id,
          reply_to_content: replyingTo.content.slice(0, 120),
          reply_to_sender: replyingTo.sender_username,
        } : {}),
      });
      setMessages(prev => prev.some(m => m.id === inserted.id) ? prev : [...prev, inserted as Message]);
      setConversations(prev => prev.map(c => c.id === activeConvId
        ? { ...c, last_message: content.trim(), last_message_at: inserted.created_at }
        : c));
      setText("");
      setReplyingTo(null);
    } catch (error: any) {
      toast({ title: "Failed to send message", description: error?.message || "Could not send message", variant: "destructive" });
    }
  }, [activeConvId, username, replyingTo, toast]);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    sendMessage(text.trim(), "text");
  }, [text, sendMessage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isProfile = false) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setUploadingImage(true);
    try {
      const url = await uploadToSupabase(file, isProfile ? "avatars" : "chat");
      if (isProfile) {
        setMyAvatar(url);
        await supabase.auth.updateUser({ data: { avatar: url, avatar_url: url } });
        toast({ title: "Avatar updated" });
      } else {
        await sendMessage(url, "image");
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload image", variant: "destructive" });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await supabase.auth.updateUser({
        data: { displayName: myDisplayName, username: myDisplayName },
      });
      toast({ title: "Profile updated" });
      setIsSettingsOpen(false);
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleCreateChannel = async () => {
    if (!newGroupName.trim() || !username) return;
    try {
      const conv = await apiRequest('/api/sitemap?type=community', 'POST', {
        action: 'chat:conversation:create', type: 'channel', name: newGroupName.trim(), participants: [username],
      });
      setConversations(prev => [conv as Conversation, ...prev]);
      setActiveConvId(conv.id);
      setIsNewGroupOpen(false);
      setNewGroupName("");
    } catch (error: any) {
      toast({ title: "Failed to create channel", description: error?.message || "Could not create channel", variant: "destructive" });
    }
  };

  const handleStartDM = async () => {
    if (!newDMUser.trim() || !username) return;
    const target = newDMUser.trim();
    // Check if DM already exists
    const existing = conversations.find(c =>
      c.type === "direct" &&
      c.participants.includes(username) &&
      c.participants.includes(target)
    );
    if (existing) { setActiveConvId(existing.id); setIsNewGroupOpen(false); setNewDMUser(""); return; }

    try {
      const conv = await apiRequest('/api/sitemap?type=community', 'POST', {
        action: 'chat:conversation:create', type: 'direct', participants: [username, target],
      });
      setConversations(prev => [conv as Conversation, ...prev]);
      setActiveConvId(conv.id);
      setIsNewGroupOpen(false);
      setNewDMUser("");
    } catch (error: any) {
      toast({ title: "Failed to start DM", description: error?.message || "Could not start direct message", variant: "destructive" });
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeConv = conversations.find(c => c.id === activeConvId);

  function convDisplayName(c: Conversation) {
    if (c.type !== "direct") return c.name || "Unnamed";
    return c.participants.find(p => p !== username) || "Unknown";
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const MIGRATION_SQL = `-- Paste this in Supabase → SQL Editor → Run
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT, type TEXT DEFAULT 'direct'
    CHECK (type IN ('direct','group','channel')),
  participants TEXT[] NOT NULL DEFAULT '{}',
  last_message TEXT, last_message_at TIMESTAMPTZ DEFAULT now(),
  avatar TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_username TEXT NOT NULL, content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text','image','system')),
  reply_to_id UUID, reply_to_content TEXT, reply_to_sender TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conv_participants ON conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages (conversation_id, created_at);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE conversations, messages FROM anon, authenticated;
-- The application server uses the Supabase service role after checking session ownership.
-- Do not create public USING(true) or WITH CHECK(true) policies.`;

  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (needsMigration) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <PageSEO title="Chat — Setup Required" description="Database setup needed" noindex />
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Setup</span>
            <div>
              <h2 className="font-black text-lg">One-time database setup needed</h2>
              <p className="text-sm text-muted-foreground">The chat tables don't exist yet in your Supabase project. Run the SQL below — it takes 5 seconds.</p>
            </div>
          </div>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Open your <strong className="text-foreground">Supabase dashboard</strong></li>
            <li>Go to <strong className="text-foreground">SQL Editor → New query</strong></li>
            <li>Paste the SQL below and click <strong className="text-foreground">Run</strong></li>
            <li>Come back here and refresh</li>
          </ol>
          <div className="relative">
            <pre className="rounded bg-muted p-4 text-xs overflow-x-auto whitespace-pre-wrap">{MIGRATION_SQL}</pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => { navigator.clipboard.writeText(MIGRATION_SQL); toast({ title: "Copied!" }); }}
            >
              Copy
            </Button>
          </div>
          <Button className="w-full" onClick={() => { setNeedsMigration(false); fetchConversations(); }}>
            I've run it — check again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-4rem)]">
      <PageSEO title="Live Chat" description="Private community messaging for signed-in CrossFire Wiki users." noindex />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div
          className="md:col-span-1 h-full flex flex-col overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
        >
          <div className="p-4 flex flex-row justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="font-black text-sm uppercase tracking-wider">Chats</span>
            <div className="flex gap-2">
              {/* Profile settings */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost"><Settings className="h-5 w-5" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Chat Profile Settings</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={myAvatar} />
                        <AvatarFallback>{getInitials(myDisplayName)}</AvatarFallback>
                      </Avatar>
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Upload className="h-4 w-4" /> Change Avatar
                        </div>
                        <Input id="avatar-upload" type="file" className="hidden" accept="image/*"
                          onChange={(e) => handleFileUpload(e, true)} />
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input value={myDisplayName} onChange={e => setMyDisplayName(e.target.value)} placeholder={username || "Display Name"} />
                    </div>
                    <Button onClick={handleUpdateProfile} className="w-full">Save Changes</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* New chat / channel */}
              <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost"><Plus className="h-5 w-5" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Chat</DialogTitle></DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Direct Message</Label>
                      <div className="flex gap-2">
                        <Input value={newDMUser} onChange={e => setNewDMUser(e.target.value)}
                          placeholder="Enter username..." onKeyDown={e => e.key === "Enter" && handleStartDM()} />
                        <Button onClick={handleStartDM} disabled={!newDMUser.trim()}>Start</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Create Channel</Label>
                      <div className="flex gap-2">
                        <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                          placeholder="# channel-name" onKeyDown={e => e.key === "Enter" && handleCreateChannel()} />
                        <Button onClick={handleCreateChannel} disabled={!newGroupName.trim()}>Create</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No conversations yet.<br />Click <strong>+</strong> to start one.
                </p>
              )}
              {conversations.map(c => {
                const isChannel = c.type !== "direct";
                const name = convDisplayName(c);
                const isActive = c.id === activeConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className="p-3 cursor-pointer transition-all flex items-center gap-3"
                    style={{
                      background: isActive ? "rgba(245,166,35,0.08)" : "transparent",
                      borderRadius: "3px",
                      borderLeft: isActive ? "2px solid #f5a623" : "2px solid transparent",
                    }}
                  >
                    <Avatar>
                      <AvatarImage src={c.avatar} />
                      <AvatarFallback style={{ background: "rgba(255,255,255,0.08)", color: "#888", fontSize: "11px" }}>
                        {isChannel ? <Hash className="h-4 w-4" /> : getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-bold truncate">{name}</div>
                      <div className="text-[11px] truncate" style={{ color: "#555" }}>
                        {c.last_message || "No messages yet"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ── Chat Area ─────────────────────────────────────────────────────── */}
        <div
          className="md:col-span-3 h-full flex flex-col overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
        >
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 flex flex-row justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={activeConv.avatar} />
                    <AvatarFallback style={{ background: "rgba(255,255,255,0.08)", color: "#888" }}>
                      {activeConv.type === "direct" ? <Users className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-black text-sm uppercase tracking-tight">{convDisplayName(activeConv)}</div>
                    {activeConv.type !== "direct" && (
                      <p className="text-[10px]" style={{ color: "#555" }}>{activeConv.participants.length} member{activeConv.participants.length !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((m, i) => {
                    const isMe = m.sender_username === username;
                    const showHeader = i === 0 || messages[i - 1].sender_username !== m.sender_username;
                    return (
                      <div key={m.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                        {showHeader && !isMe && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback>{getInitials(m.sender_username)}</AvatarFallback>
                          </Avatar>
                        )}
                        {!showHeader && !isMe && <div className="w-8" />}

                        <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          {showHeader && (
                            <div className="text-xs font-semibold mb-1 px-1">
                              {isMe ? "You" : m.sender_username}
                            </div>
                          )}
                          <div
                            className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                              isMe ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                            }`}
                            onClick={() => setReplyingTo(m)}
                          >
                            {/* Reply preview */}
                            {m.reply_to_id && (
                              <div className={`mb-2 p-2 rounded border-l-4 text-xs opacity-80 ${
                                isMe ? "bg-primary/20 border-primary-foreground/50" : "bg-muted border-border"
                              }`}>
                                <div className="font-semibold">{m.reply_to_sender || "Unknown"}</div>
                                <div className="truncate">{(m.reply_to_content || "").slice(0, 50)}</div>
                              </div>
                            )}

                            {/* Content */}
                            {m.type === "image" ? (
                              <div className="space-y-2">
                                <img
                                  src={m.content}
                                  alt="Shared image"
                                  className="rounded-lg max-w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={e => { e.stopPropagation(); window.open(m.content, "_blank"); }}
                                />
                                <p className="text-xs opacity-80">Click to view full size</p>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap break-words">
                                {m.content}
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 px-1 opacity-70 flex items-center gap-2">
                            <span>{fmtTime(m.created_at)}</span>
                            {!isMe && (
                              <Button variant="ghost" size="sm" className="h-4 px-1 text-[10px] opacity-50 hover:opacity-100"
                                onClick={e => { e.stopPropagation(); setReplyingTo(m); }}>
                                Reply
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="p-4 border-t bg-background/50 space-y-2">
                {replyingTo && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-muted-foreground">Replying to</span>
                      <span className="font-semibold truncate">{replyingTo.sender_username}</span>
                      <span className="text-muted-foreground truncate">: {replyingTo.content.slice(0, 30)}{replyingTo.content.length > 30 ? "…" : ""}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Label htmlFor="file-upload" className={`cursor-pointer p-2 hover:bg-muted rounded-full ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingImage
                      ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                      : <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    }
                    <Input id="file-upload" type="file" className="hidden" accept="image/*"
                      onChange={e => handleFileUpload(e, false)} disabled={uploadingImage} />
                  </Label>
                  <Input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={replyingTo ? "Type your reply…" : "Type a message…"}
                    className="flex-1 rounded-full"
                  />
                  <Button onClick={handleSend} size="icon" className="rounded-full" disabled={!text.trim() || uploadingImage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">Select a conversation to start chatting</p>
              <p className="text-xs mt-1 opacity-60">or click <strong>+</strong> to start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
