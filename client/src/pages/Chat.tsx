import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PageSEO from "@/components/PageSEO";
import { useLocation } from "wouter";
import { Send, Image as ImageIcon, Plus, Users, Hash, MoreVertical, Phone, Video, Settings, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

interface Conversation {
  id?: string;
  _id?: string;
  name?: string;
  type: 'direct' | 'group' | 'channel';
  avatar?: string;
  participants: string[];
  participantsDetails?: User[];
  lastMessage?: string;
  lastMessageAt?: string;
}

interface Message {
  id?: string;
  _id?: string;
  conversationId: string;
  senderId?: string; // Legacy
  sender?: string; // New schema uses sender (username)
  content: string;
  type?: 'text' | 'image' | 'system';
  createdAt: string;
  replyTo?: string;
  replyToMessage?: Message;
}

function getWsUrl(token: string) {
  const api = import.meta.env.VITE_API_URL || "";
  let url = "/ws";
  
  if (api && api.trim()) {
    try {
      const u = new URL(api);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      url = `${proto}//${u.host}/ws`;
    } catch {
      url = "/ws";
    }
  } else {
    // Use current window location for development
    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host || "localhost:5000";
      url = `${proto}//${host}/ws`;
    } catch {
      url = "ws://localhost:5000/ws";
    }
  }
  return `${url}?token=${token}`;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Modals state
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  
  // Profile state
  const [myDisplayName, setMyDisplayName] = useState("");
  const [myAvatar, setMyAvatar] = useState("");
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const token = localStorage.getItem("userToken");
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");

  // Helper to get user details
  const getUserDetails = (usernameArg: string, convId?: string) => {
    if (usernameArg === username) return { id: userId || "", username: "You", displayName: myDisplayName || "You", avatar: myAvatar };
    
    // Try to find in the current conversation first
    if (convId) {
      const conv = conversations.find(c => (c.id === convId || c._id === convId));
      const u = conv?.participantsDetails?.find(p => p.username === usernameArg);
      if (u) return u;
    }
    
    // Search in all conversations
    for (const c of conversations) {
      const u = c.participantsDetails?.find(p => p.username === usernameArg);
      if (u) return u;
    }
    return { id: usernameArg, username: usernameArg, displayName: usernameArg };
  };

  // Connect to WS and Fetch Conversations
  useEffect(() => {
    if (!token || !userId) {
      setLocation("/login");
      return;
    }

    // Fetch conversations
    fetch("/api/chat/conversations", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        setConversations(data);
        
        // Extract my profile from response if possible or fetch it
        // Since getConversationsByUser enriches response with participantsDetails, 
        // we can find ourselves in one of them.
        for (const c of data) {
          // Check if participantsDetails exists (backend might not send it yet, we might need to fetch users)
          const me = c.participantsDetails?.find((p: User) => p.username === username);
          if (me) {
            setMyDisplayName(me.displayName || me.username);
            setMyAvatar(me.avatar || "");
            break;
          }
        }
      }
    })
    .catch(console.error);

    // WebSocket Connection
    let retry = 0;
    let closed = false;
    
    const connect = () => {
      if (closed) return;
      const ws = new WebSocket(getWsUrl(token));
      wsRef.current = ws;

      ws.onopen = () => { retry = 0; console.log("WS Connected"); };
      
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          
          if (data.type === "message") {
            const newMsg = data.message;
            // Update messages if looking at this conversation
            setMessages(prev => {
              if (activeConversationId === newMsg.conversationId) {
                // Check if message already exists (optimistic update or duplicate)
                if (prev.some(m => m.id === newMsg.id || m.id === newMsg._id)) return prev;
                return [...prev, { ...newMsg, id: newMsg.id || newMsg._id }];
              }
              return prev;
            });
            
            // Update conversation last message time
            setConversations(prev => prev.map(c => 
              (c.id === newMsg.conversationId || c._id === newMsg.conversationId)
                ? { ...c, lastMessage: newMsg.content, lastMessageAt: newMsg.createdAt } 
                : c
            ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()));
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };

      ws.onclose = () => {
        if (!closed) {
          retry = Math.min(retry + 1, 5);
          setTimeout(connect, 1000 * retry);
        }
      };
    };

    connect();
    return () => { closed = true; wsRef.current?.close(); };
  }, [token, userId, setLocation]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !token) return;

    fetch(`/api/chat/conversations/${activeConversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        // Enrich messages with reply information
        const enrichedMessages = data.map((msg: Message) => {
          if (msg.replyTo) {
            const repliedMsg = data.find((m: Message) => (m.id || m._id) === msg.replyTo);
            return { ...msg, replyToMessage: repliedMsg };
          }
          return msg;
        });
        setMessages(enrichedMessages);
        // Scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    })
    .catch(console.error);
  }, [activeConversationId, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!text.trim() || !activeConversationId) return;

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: text,
          type: "text",
          replyTo: replyingTo?.id || replyingTo?._id || undefined
        })
      });

      if (res.ok) {
        const msg = await res.json();
        // Add to messages immediately (though WS will also send it back, de-dupe handled there)
        setMessages(prev => [...prev, msg]);
        setText("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isProfile = false) => {
    if (!e.target.files?.length || !token) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const tokRes = await fetch("/api/security/csrf-token");
      const tokJson = await tokRes.json();
      const csrf = tokJson?.csrfToken || "";
      const res = await fetch("/images/upload", {
        method: "POST",
        headers: { "X-CSRF-Token": csrf, Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      const url = data.domainUrl || data.domain_url || data.cloudinaryUrl || data.secure_url;
      if (url) {
        if (isProfile) {
          setMyAvatar(url);
          // Also update backend profile
          setMyDisplayName(prev => {
            // We need the latest displayName to update profile correctly
            const updatedProfile = { displayName: prev, avatar: url };
            fetch("/api/users/me", {
              method: "PATCH",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify(updatedProfile)
            }).then(r => {
              if (r.ok) toast({ title: "Profile updated" });
            });
            return prev;
          });
        } else if (activeConversationId) {
          // Send image message
          await fetch("/api/chat/messages", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              conversationId: activeConversationId,
              content: url,
              type: "image"
            })
          });
        }
      }
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !token) return;

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          participants: [username], // Self is included, backend handles it but good to be explicit
          type: "channel",
          initialMessage: `Welcome to ${newGroupName}`
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setConversations(prev => [data, ...prev]);
        setIsNewGroupOpen(false);
        setNewGroupName("");
        setActiveConversationId(data.id || data._id);
      }
    } catch (error) {
      toast({ title: "Failed to create group", variant: "destructive" });
    }
  };

  const handleUpdateProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          displayName: myDisplayName,
          avatar: myAvatar
        })
      });
      if (res.ok) {
        toast({ title: "Profile updated" });
        setIsSettingsOpen(false);
      }
    } catch (error) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const activeConversation = conversations.find(c => (c.id === activeConversationId || c._id === activeConversationId));

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
      <PageSEO title="Live Chat" description="Real-time communication" />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        {/* Sidebar */}
        <Card className="md:col-span-1 h-full flex flex-col border-0 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader className="p-4 border-b flex flex-row justify-between items-center">
            <CardTitle className="text-xl">Chats</CardTitle>
            <div className="flex gap-2">
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost"><Settings className="h-5 w-5" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Chat Profile Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={myAvatar} />
                        <AvatarFallback>{myDisplayName?.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Upload className="h-4 w-4" /> Change Avatar
                        </div>
                        <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, true)} />
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
              <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost"><Plus className="h-5 w-5" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Channel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Channel Name</Label>
                      <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="# general" />
                    </div>
                    <Button onClick={handleCreateGroup} className="w-full">Create Channel</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {conversations.map(c => {
                const otherUser = c.participantsDetails?.find(p => p.username !== username) || { displayName: "Unknown", avatar: "", username: "Unknown" };
                const isChannel = c.type === 'channel' || c.type === 'group';
                const displayName = isChannel ? c.name : (otherUser.displayName || otherUser.username || c.participants.find(p => p !== username));
                const avatar = isChannel ? c.avatar : otherUser.avatar;
                const cId = c.id || c._id || "";

                return (
                  <div 
                    key={cId} 
                    onClick={() => setActiveConversationId(cId)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${activeConversationId === cId ? 'bg-primary/10' : 'hover:bg-muted'}`}
                  >
                    <Avatar>
                      <AvatarImage src={avatar} />
                      <AvatarFallback>{isChannel ? <Hash className="h-4 w-4" /> : displayName?.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium truncate">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.lastMessage ? c.lastMessage : (c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : 'No messages')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-3 h-full flex flex-col border-0 shadow-lg bg-card/50 backdrop-blur">
          {activeConversationId ? (
            <>
              <CardHeader className="p-4 border-b flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={activeConversation?.type === 'channel' ? activeConversation.avatar : activeConversation?.participantsDetails?.find(p => p.username !== username)?.avatar} />
                    <AvatarFallback>{activeConversation?.type === 'channel' ? <Hash /> : <Users />}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {activeConversation?.type === 'channel' ? activeConversation.name : (activeConversation?.participantsDetails?.find(p => p.username !== username)?.displayName || activeConversation?.participants.find(p => p !== username))}
                    </CardTitle>
                    {activeConversation?.type === 'channel' && (
                      <p className="text-xs text-muted-foreground">{activeConversation.participants.length} members</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost"><Phone className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost"><Video className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((m, i) => {
                    const isMe = m.sender === username;
                    const sender = getUserDetails(m.sender || "Unknown", activeConversationId || undefined);
                    const showHeader = i === 0 || messages[i-1].sender !== m.sender;
                    const repliedMessage = m.replyTo ? messages.find(msg => (msg.id || msg._id) === m.replyTo) : null;
                    const repliedSender = repliedMessage ? getUserDetails(repliedMessage.sender || "Unknown", activeConversationId || undefined) : null;

                    return (
                      <div key={m.id || m._id || i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                        {showHeader && !isMe && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={sender.avatar} />
                            <AvatarFallback>{sender.displayName?.substring(0,1) || sender.username?.substring(0,1)}</AvatarFallback>
                          </Avatar>
                        )}
                        {!showHeader && !isMe && <div className="w-8" />}

                        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          {showHeader && (
                            <div className="text-xs font-semibold text-foreground mb-1 px-1 flex items-center gap-2">
                              {!isMe && (
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={sender.avatar} />
                                  <AvatarFallback className="text-[8px]">{sender.displayName?.substring(0,1) || sender.username?.substring(0,1)}</AvatarFallback>
                                </Avatar>
                              )}
                              <span>{isMe ? 'You' : (sender.displayName || sender.username || 'Unknown')}</span>
                            </div>
                          )}
                          <div 
                            className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${isMe ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
                            onClick={() => setReplyingTo(m)}
                          >
                            {repliedMessage && (
                              <div className={`mb-2 p-2 rounded border-l-4 ${isMe ? 'bg-primary/20 border-primary-foreground/50' : 'bg-muted border-border'} text-xs opacity-80`}>
                                <div className="font-semibold">{repliedSender?.displayName || repliedSender?.username || 'Unknown'}</div>
                                <div className="truncate">{repliedMessage.content.substring(0, 50)}{repliedMessage.content.length > 50 ? '...' : ''}</div>
                              </div>
                            )}
                            {m.type === 'image' && (
                              <div className="space-y-2">
                                <img 
                                  src={m.content} 
                                  alt="Shared image" 
                                  className="rounded-lg max-w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(m.content, '_blank');
                                  }}
                                />
                                <p className="text-xs opacity-80">Click to view full size</p>
                              </div>
                            )}
                            {m.type !== 'image' && (
                              <div className="whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
                                {m.content.split('\n').map((line, idx) => (
                                  <p key={idx} className="mb-2 last:mb-0">{line || '\u00A0'}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 px-1 opacity-70 flex items-center gap-2">
                            <span>{new Date(m.createdAt).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                            {!isMe && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 px-1 text-[10px] opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyingTo(m);
                                }}
                              >
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

              <div className="p-4 border-t bg-background/50 space-y-2">
                {replyingTo && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-muted-foreground">Replying to</span>
                      <span className="font-semibold truncate">{getUserDetails(replyingTo.sender || "Unknown", activeConversationId || undefined).displayName || getUserDetails(replyingTo.sender || "Unknown", activeConversationId || undefined).username}</span>
                      <span className="text-muted-foreground truncate">: {replyingTo.content.substring(0, 30)}{replyingTo.content.length > 30 ? '...' : ''}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Label htmlFor="file-upload" className="cursor-pointer p-2 hover:bg-muted rounded-full">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <Input id="file-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, false)} />
                  </Label>
                  <Input 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={replyingTo ? "Type your reply..." : "Type a message or share an image..."} 
                    className="flex-1 rounded-full"
                  />
                  <Button onClick={handleSendMessage} size="icon" className="rounded-full" disabled={!text.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
