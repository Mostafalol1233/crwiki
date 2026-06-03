import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createTicket } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";
import { ExternalLink, HelpCircle, Mail, User } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { SiWhatsapp } from "react-icons/si";

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";

const ticketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  userName: z.string().min(2, "Name must be at least 2 characters"),
  userEmail: z.string().email("Please enter a valid email address"),
  category: z.string().min(1, "Please select a category"),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function Support() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      userName: "",
      userEmail: "",
      category: "",
      priority: "normal",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const titleParam = params.get("title");
    const categoryParam = params.get("category");
    
    if (titleParam) form.setValue("title", titleParam);
    if (categoryParam) form.setValue("category", categoryParam);
    
    // Try to pre-fill user info from localStorage if available
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
      form.setValue("userName", savedUsername);
    }
  }, [form]);

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return createTicket({
        title: data.title,
        description: data.description,
        userName: data.userName,
        userEmail: data.userEmail,
        category: data.category,
        priority: data.priority || 'normal',
      });
    },
    onSuccess: () => {
      toast({
        title: "Ticket Submitted",
        description: "Your support ticket has been submitted successfully. We'll get back to you soon!",
      });
      setIsSubmitted(true);
      form.reset();
      setTimeout(() => setIsSubmitted(false), 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  return (
    <>
      <PageSEO
        title={"Support — CrossFire Wiki"}
        description={"Need help? Submit a support ticket and our team will assist you."}
        canonicalPath="/support"
      />
      <div className="min-h-screen py-12 md:py-16" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
            <HelpCircle className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>Support Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
            Submit a Ticket
          </h1>
          <p className="text-sm" style={{ color: "#666" }}>
            Need help? Fill out the form below and our team will get back to you.
          </p>
        </div>

        <a
          href={WHATSAPP_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 transition-all hover:-translate-y-0.5 hover:brightness-110"
          style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "4px", textDecoration: "none" }}
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-11 h-11 flex items-center justify-center rounded" style={{ background: "rgba(37,211,102,0.16)" }}>
              <SiWhatsapp className="h-6 w-6" style={{ color: "#25d366" }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: "#25d366" }}>WhatsApp Channel</p>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Join our WhatsApp channel for updates and quick community support.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "#25d366" }}>
            Open Channel <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </a>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Response Time", value: "24–48 hrs", color: "#f5a623" },
            { label: "Email Updates", value: "Auto-notify", color: "#818cf8" },
            { label: "Track Status", value: "My Tickets", color: "#4ade80" },
          ].map((info) => (
            <div key={info.label} className="p-3 text-center" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px" }}>
              <p className="text-sm font-black mb-0.5" style={{ color: info.color }}>{info.value}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#555" }}>{info.label}</p>
            </div>
          ))}
        </div>

        {isSubmitted && (
          <div className="mb-6 flex items-center gap-3 p-4" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "3px" }}>
            <span style={{ color: "#4ade80", fontSize: "18px" }}>✓</span>
            <p className="text-sm font-bold" style={{ color: "#4ade80" }}>
              Ticket submitted successfully! Check your email for updates.
            </p>
          </div>
        )}

        <div style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
          <div className="p-5 md:p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Support Ticket Form</h2>
            <p className="text-[11px] mt-1" style={{ color: "#555" }}>All fields are required unless marked optional.</p>
          </div>
          <div className="p-5 md:p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="John Doe"
                              className="pl-10"
                              data-testid="input-ticket-name"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              className="pl-10"
                              data-testid="input-ticket-email"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ticket-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="account">Account Support</SelectItem>
                            <SelectItem value="billing">Billing Question</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ticket-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of your issue"
                          data-testid="input-ticket-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide detailed information about your issue..."
                          rows={8}
                          data-testid="textarea-ticket-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel>Attach Image (optional)</FormLabel>
                    <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} data-testid="input-ticket-image" />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Attach Video (optional)</FormLabel>
                    <Input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} data-testid="input-ticket-video" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                  disabled={createTicketMutation.isPending}
                  data-testid="button-submit-ticket"
                >
                  {createTicketMutation.isPending ? "Submitting…" : "Submit Ticket"}
                </button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
