import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/LanguageProvider";
import { getMyTickets, getTicketReplies, addTicketReply, getCurrentUser } from "@/lib/supabaseApi";
import { Ticket, MessageSquare, Clock, Mail, Send } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { buildAuthPath } from "@/lib/authRedirect";

interface TicketType {
  id: string;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketReplyType {
  id: string;
  ticketId: string;
  authorName: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  open:        { bg: "rgba(96,165,250,0.1)",  color: "#60a5fa" },
  "in-progress":{ bg: "rgba(251,191,36,0.1)", color: "#fbbf24" },
  resolved:    { bg: "rgba(74,222,128,0.1)",  color: "#4ade80" },
  closed:      { bg: "rgba(100,116,139,0.1)", color: "#64748b" },
};
const priorityStyles: Record<string, { bg: string; color: string }> = {
  high:   { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
  normal: { bg: "rgba(96,165,250,0.1)",   color: "#60a5fa" },
  low:    { bg: "rgba(100,116,139,0.1)",  color: "#64748b" },
};

function StatusBadge({ label, styles, ...props }: { label: string; styles: { bg: string; color: string }; [key: string]: any }) {
  return (
    <Badge variant="outline" {...props} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: styles.bg, color: styles.color }}>
      {label}
    </Badge>
  );
}

export default function MyTickets() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    getCurrentUser().then((user) => {
      if (!active) return;
      setAuthState(user ? "signed-in" : "signed-out");
    }).catch(() => active && setAuthState("signed-out"));
    return () => { active = false; };
  }, []);
  const [authState, setAuthState] = useState<"loading" | "signed-in" | "signed-out">("loading");
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets/my"],
    queryFn: getMyTickets,
    enabled: authState === "signed-in",
  });

  const { data: replies = [] } = useQuery<TicketReplyType[]>({
    queryKey: ["/api/tickets", selectedTicket?.id, "replies"],
    queryFn: () => getTicketReplies(selectedTicket!.id),
    enabled: !!selectedTicket,
  });

  const addReplyMutation = useMutation({
    mutationFn: async (data: { ticketId: string; content: string; authorName: string }) => {
      return await addTicketReply(data.ticketId, data.content, data.authorName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket?.id, "replies"] });
      setReplyContent("");
      toast({ title: "Reply sent" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add reply", variant: "destructive" });
    },
  });

  const handleAddReply = () => {
    if (!replyContent.trim() || !selectedTicket) return;
    addReplyMutation.mutate({ ticketId: selectedTicket.id, content: replyContent, authorName: selectedTicket.userName });
  };

  return (
    <>
      <PageSEO
        title={`${isArabic ? "تذاكري للدعم" : "My Support Tickets"} — CrossFire Wiki`}
        description={isArabic ? "اعرض تذاكر الدعم التي أرسلتها وأضف ردودًا جديدة." : "View your submitted support tickets and add replies."}
        canonicalPath="/my-tickets"
        noindex
      />
      <div className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* Hero */}
        <div className="relative overflow-hidden py-12 md:py-16" style={{ background: "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--background)) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,166,35,0.04) 0%, transparent 70%)" }} />
          <div className="relative max-w-5xl mx-auto px-6">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
              <Ticket className="h-3 w-3" style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>{isArabic ? "الدعم" : "Support"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
              {isArabic ? "تذاكر" : "My"} <span style={{ color: "#f5a623" }}>{isArabic ? "الدعم" : "Tickets"}</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "#555" }}>{isArabic ? "اعرض تذاكر الدعم وتابعها." : "View and manage your support tickets"}</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

          {authState === "loading" ? (
            <div className="max-w-md mx-auto text-center py-16 text-sm" style={{ color: "#777" }}>{isArabic ? "جارٍ التحقق من الجلسة..." : "Checking your session..."}</div>
          ) : authState === "signed-out" ? (
            <div className="max-w-md mx-auto">
              <Card className="rounded-2xl border-border/60 bg-card/80 shadow-lg" style={{ background: "var(--card)", borderColor: "rgba(255,255,255,0.06)" }}>
                <CardContent className="p-6 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-3" style={{ color: "#f5a623" }} />
                  <h2 className="font-black text-sm uppercase tracking-wider mb-2" style={{ color: "var(--foreground)" }}>{isArabic ? "سجّل الدخول لعرض تذاكرك" : "Sign in to view your tickets"}</h2>
                  <p className="text-xs mb-4" style={{ color: "#777" }}>{isArabic ? "لخصوصيتك، لا يمكن الوصول إلى التذاكر بالبريد الإلكتروني وحده." : "For your privacy, tickets cannot be accessed by email alone."}</p>
                  <Button asChild className="w-full h-10 rounded-lg text-[11px] font-black uppercase tracking-widest" style={{ background: "#f5a623", color: "#000" }}>
                    <a href={buildAuthPath("login")}>{isArabic ? "تسجيل الدخول" : "Sign in"}</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-5">
              {/* Ticket List */}
              <div className="lg:col-span-1 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
                    {isArabic ? "التذاكر" : "Tickets"} <span style={{ color: "#f5a623" }}>({tickets.length})</span>
                  </h2>
                </div>

                {isLoading ? (
                  <div className="py-8 text-center text-xs" style={{ color: "#555" }}>{isArabic ? "جارٍ التحميل..." : "Loading..."}</div>
                ) : tickets.length === 0 ? (
                  <div className="py-8 text-center" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "3px" }}>
                    <p className="text-xs" style={{ color: "#555" }}>{isArabic ? "لم يتم العثور على تذاكر." : "No tickets found"}</p>
                  </div>
                ) : (
                  tickets.map((ticket) => {
                    const st = statusStyles[ticket.status.toLowerCase()] || statusStyles.closed;
                    const active = selectedTicket?.id === ticket.id;
                    return (
                      <button
                        key={ticket.id}
                        className="w-full text-left p-4 block transition-all"
                        style={{
                          background: "var(--card)",
                          border: active ? "1px solid rgba(245,166,35,0.4)" : "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "3px",
                        }}
                        onClick={() => setSelectedTicket(ticket)}
                        data-testid={`ticket-card-${ticket.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-bold text-sm line-clamp-2" style={{ color: "var(--foreground)" }} data-testid={`text-ticket-title-${ticket.id}`}>{ticket.title}</span>
                          <StatusBadge label={ticket.status} styles={st} data-testid={`badge-status-${ticket.id}`} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge label={ticket.priority} styles={priorityStyles[ticket.priority.toLowerCase()] || priorityStyles.normal} data-testid={`badge-priority-${ticket.id}`} />
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#444" }} data-testid={`badge-category-${ticket.id}`}>{ticket.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px]" style={{ color: "#444" }}>
                          <Clock className="h-2.5 w-2.5" />
                          {ticket.createdAt}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Ticket Detail */}
              <div className="lg:col-span-2">
                {selectedTicket ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                      <h3 className="font-black text-lg uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }} data-testid={`text-ticket-detail-title-${selectedTicket.id}`}>
                        {selectedTicket.title}
                      </h3>
                      <div className="flex gap-2 flex-wrap mb-4">
                        <StatusBadge label={selectedTicket.status} styles={statusStyles[selectedTicket.status.toLowerCase()] || statusStyles.closed} data-testid={`badge-detail-status-${selectedTicket.id}`} />
                        <StatusBadge label={selectedTicket.priority} styles={priorityStyles[selectedTicket.priority.toLowerCase()] || priorityStyles.normal} data-testid={`badge-detail-priority-${selectedTicket.id}`} />
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#666" }} data-testid={`badge-detail-category-${selectedTicket.id}`}>{selectedTicket.category}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "#888" }} data-testid={`text-ticket-description-${selectedTicket.id}`}>{selectedTicket.description}</p>
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#555" }}>{isArabic ? "أُنشئت" : "Created"}</span>
                          <p className="text-xs font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{selectedTicket.createdAt}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#555" }}>{isArabic ? "آخر تحديث" : "Updated"}</span>
                          <p className="text-xs font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{selectedTicket.updatedAt}</p>
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                      <h4 className="font-black text-xs uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                        <MessageSquare className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                        {isArabic ? "الردود" : "Replies"} ({replies.length})
                      </h4>

                      <div className="space-y-3 mb-5">
                        {replies.map((reply) => (
                          <div key={reply.id} className="p-3 rounded" style={{ background: reply.isAdmin ? "rgba(245,166,35,0.05)" : "rgba(255,255,255,0.03)", borderLeft: `2px solid ${reply.isAdmin ? "#f5a623" : "rgba(255,255,255,0.08)"}` }} data-testid={`reply-${reply.id}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-bold text-xs" style={{ color: "var(--foreground)" }} data-testid={`text-reply-author-${reply.id}`}>{reply.authorName}</span>
                              {reply.isAdmin && (
                                <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5" style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623", borderRadius: "2px" }} data-testid={`badge-admin-${reply.id}`}>Admin</span>
                              )}
                              <span className="text-[10px]" style={{ color: "#444" }} data-testid={`text-reply-date-${reply.id}`}>{reply.createdAt}</span>
                            </div>
                            <p className="text-xs whitespace-pre-wrap" style={{ color: "#888" }} data-testid={`text-reply-content-${reply.id}`}>{reply.content}</p>
                          </div>
                        ))}

                        {replies.length === 0 && (
                          <p className="text-xs text-center py-4" style={{ color: "#444" }}>No replies yet</p>
                        )}
                      </div>

                      {/* Reply Form */}
                      <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <p className="font-black text-[10px] uppercase tracking-wider mb-2" style={{ color: "#888" }}>Add Reply</p>
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={3}
                          className="text-sm mb-2"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", resize: "none" }}
                          data-testid="textarea-ticket-reply"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleAddReply}
                            disabled={!replyContent.trim() || addReplyMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-4 h-8 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-50"
                            style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                            data-testid="button-add-reply"
                          >
                            <Send className="h-3 w-3" />
                            {addReplyMutation.isPending ? "Sending..." : "Send"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                    <div className="text-center">
                      <Ticket className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: "#f5a623" }} />
                      <p className="text-xs" style={{ color: "#444" }}>Select a ticket to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
