import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Ticket, MessageSquare, Clock, Mail } from "lucide-react";

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

export default function MyTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets/my", searchedEmail],
    enabled: !!searchedEmail,
  });

  const { data: replies = [] } = useQuery<TicketReplyType[]>({
    queryKey: ["/api/tickets", selectedTicket?.id, "replies"],
    enabled: !!selectedTicket,
  });

  const addReplyMutation = useMutation({
    mutationFn: async (data: { ticketId: string; content: string; authorName: string }) => {
      return await apiRequest(`/api/tickets/${data.ticketId}/replies`, "POST", {
        authorName: data.authorName,
        content: data.content,
        isAdmin: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket?.id, "replies"] });
      setReplyContent("");
      toast({
        title: "Reply Added",
        description: "Your reply has been added to the ticket.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add reply",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to view your tickets",
        variant: "destructive",
      });
      return;
    }
    setSearchedEmail(email);
    setSelectedTicket(null);
  };

  const handleAddReply = () => {
    if (!replyContent.trim() || !selectedTicket) return;
    
    addReplyMutation.mutate({
      ticketId: selectedTicket.id,
      content: replyContent,
      authorName: selectedTicket.userName,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open": return "bg-blue-500";
      case "in-progress": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      case "closed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500";
      case "normal": return "bg-blue-500";
      case "low": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">My Support Tickets</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            View and manage your support tickets
          </p>
        </div>

        {!searchedEmail ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Enter Your Email</CardTitle>
              <CardDescription>
                Enter the email address you used to submit your tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                    data-testid="input-search-email"
                  />
                </div>
                <Button onClick={handleSearch} className="w-full" data-testid="button-search-tickets">
                  View My Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Tickets ({tickets.length})</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchedEmail("");
                    setEmail("");
                    setSelectedTicket(null);
                  }}
                  data-testid="button-change-email"
                >
                  Change Email
                </Button>
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Loading tickets...</p>
                  </CardContent>
                </Card>
              ) : tickets.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No tickets found for this email</p>
                  </CardContent>
                </Card>
              ) : (
                tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className={`cursor-pointer hover-elevate ${
                      selectedTicket?.id === ticket.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                    data-testid={`ticket-card-${ticket.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2" data-testid={`text-ticket-title-${ticket.id}`}>{ticket.title}</CardTitle>
                        <Badge className={getStatusColor(ticket.status)} data-testid={`badge-status-${ticket.id}`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)} data-testid={`badge-priority-${ticket.id}`}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-category-${ticket.id}`}>{ticket.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {ticket.createdAt}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="lg:col-span-2">
              {selectedTicket ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2" data-testid={`text-ticket-detail-title-${selectedTicket.id}`}>{selectedTicket.title}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={getStatusColor(selectedTicket.status)} data-testid={`badge-detail-status-${selectedTicket.id}`}>
                            {selectedTicket.status}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)} data-testid={`badge-detail-priority-${selectedTicket.id}`}>
                            {selectedTicket.priority}
                          </Badge>
                          <Badge variant="outline" data-testid={`badge-detail-category-${selectedTicket.id}`}>{selectedTicket.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap" data-testid={`text-ticket-description-${selectedTicket.id}`}>{selectedTicket.description}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <p className="font-medium">{selectedTicket.createdAt}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Updated:</span>
                        <p className="font-medium">{selectedTicket.updatedAt}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Replies ({replies.length})
                      </h3>

                      <div className="space-y-4">
                        {replies.map((reply) => (
                          <Card key={reply.id} data-testid={`reply-${reply.id}`}>
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-sm" data-testid={`text-reply-author-${reply.id}`}>{reply.authorName}</span>
                                    {reply.isAdmin && (
                                      <Badge variant="default" className="text-xs" data-testid={`badge-admin-${reply.id}`}>Admin</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground" data-testid={`text-reply-date-${reply.id}`}>{reply.createdAt}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-reply-content-${reply.id}`}>
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Add a Reply</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Textarea
                              placeholder="Type your reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={4}
                              data-testid="textarea-ticket-reply"
                            />
                            <Button
                              onClick={handleAddReply}
                              disabled={!replyContent.trim() || addReplyMutation.isPending}
                              data-testid="button-add-reply"
                            >
                              {addReplyMutation.isPending ? "Sending..." : "Send Reply"}
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a ticket to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
