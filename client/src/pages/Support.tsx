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
import { ExternalLink, HelpCircle, Mail, User, MessageSquare } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { ImageUploadButton } from "@/components/ImageUploadButton";

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
  const [attachmentUrl, setAttachmentUrl] = useState("");

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
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) form.setValue("userName", savedUsername);
  }, [form]);

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return createTicket({
        title: data.title,
        description: attachmentUrl
          ? `${data.description}\n\n[Attachment](${attachmentUrl})`
          : data.description,
        userName: data.userName,
        userEmail: data.userEmail,
        category: data.category,
        priority: data.priority || "normal",
      });
    },
    onSuccess: () => {
      toast({
        title: "Ticket Submitted",
        description: "Your support ticket has been submitted. We'll get back to you soon!",
      });
      setIsSubmitted(true);
      setAttachmentUrl("");
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
        title="Support — CrossFire Wiki"
        description="Need help? Submit a support ticket and our team will assist you."
        canonicalPath="/support"
      />
      <div className="min-h-screen py-12 md:py-16" style={{ background: "hsl(var(--background))" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-8">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
              <HelpCircle size={14} strokeWidth={1.5} style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>Support Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2" style={{ color: "hsl(var(--foreground))" }}>
              Submit a Ticket
            </h1>
            <p className="text-base font-semibold" style={{ color: "hsl(var(--foreground))", opacity: 0.72 }}>
              Need help? Fill out the form below and our team will get back to you.
            </p>
          </div>

          {/* WhatsApp Banner */}
          <a
            href={WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 transition-all hover:-translate-y-0.5"
            style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "4px", textDecoration: "none", display: "flex" }}
          >
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-11 h-11 flex items-center justify-center rounded flex-shrink-0" style={{ background: "rgba(37,211,102,0.16)" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: "#25d366" }}>WhatsApp Channel</p>
                <p className="text-base font-extrabold" style={{ color: "hsl(var(--foreground))" }}>Join our WhatsApp channel for updates and quick community support.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest flex-shrink-0" style={{ color: "#25d366" }}>
              Open Channel <ExternalLink size={14} strokeWidth={1.5} />
            </span>
          </a>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Response Time", value: "24–48 hrs", color: "#f5a623" },
              { label: "Email Updates", value: "Auto-notify", color: "#f5a623" },
              { label: "Track Status", value: "My Tickets", color: "#f5a623" },
            ].map((info) => (
              <div key={info.label} className="p-3 text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "3px" }}>
                <p className="text-sm font-black mb-0.5" style={{ color: info.color }}>{info.value}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{info.label}</p>
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

          <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "4px" }}>
            <div className="p-5 md:p-6" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "hsl(var(--foreground))" }}>Support Ticket Form</h2>
              <p className="text-[11px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>All fields are required unless marked optional.</p>
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
                              <User size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="John Doe" className="pl-10" {...field} />
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
                              <Mail size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input type="email" placeholder="john@example.com" className="pl-10" {...field} />
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
                              <SelectTrigger>
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
                              <SelectTrigger>
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
                          <Input placeholder="Brief description of your issue" {...field} />
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
                            rows={7}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Attachment */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Attachment (optional)</p>
                    <ImageUploadButton
                      onUpload={setAttachmentUrl}
                      folder="tickets"
                      label="Upload Screenshot or Image"
                    />
                    {attachmentUrl && (
                      <p className="text-xs text-green-500">✓ Image uploaded — will be included with your ticket</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                    disabled={createTicketMutation.isPending}
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
