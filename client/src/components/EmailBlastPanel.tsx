import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Users, User, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

interface Props {
  subscribers: Subscriber[];
}

const WIKI_BACK_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CrossFire Wiki is Back</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header bar -->
          <tr>
            <td style="background:#f5a623;padding:4px 0;border-radius:3px 3px 0 0;"></td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#111;border:1px solid rgba(245,166,35,0.15);border-top:none;border-radius:0 0 4px 4px;padding:48px 40px 40px;">

              <!-- Logo / brand -->
              <p style="margin:0 0 6px;font-size:10px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;color:#f5a623;">CrossFire Wiki</p>
              <h1 style="margin:0 0 6px;font-size:42px;font-weight:900;text-transform:uppercase;letter-spacing:-1px;color:#fff;line-height:1;">
                CrossFire
              </h1>
              <h1 style="margin:0 0 32px;font-size:42px;font-weight:900;text-transform:uppercase;letter-spacing:-1px;color:transparent;-webkit-text-stroke:1px #f5a623;line-height:1;">
                Wiki is Back
              </h1>

              <!-- Body text -->
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#aaa;">
                CrossFire Wiki is an independent reference site for game data, guides, events, and community updates.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#aaa;">
                Browse weapon stats, mercenary profiles, event records, rank progression, and community seller listings in one organized reference, maintained by players.
              </p>

              <!-- What's new list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:4px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:20px;color:#f5a623;font-size:11px;font-weight:900;vertical-align:top;padding-top:2px;">01</td>
                        <td style="padding-left:12px;font-size:13px;color:#888;line-height:1.5;">Full weapon database with damage, range, and fire rate per gun</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:20px;color:#f5a623;font-size:11px;font-weight:900;vertical-align:top;padding-top:2px;">02</td>
                        <td style="padding-left:12px;font-size:13px;color:#888;line-height:1.5;">Live event tracker — giveaways, seasonal events, limited-time content</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:20px;color:#f5a623;font-size:11px;font-weight:900;vertical-align:top;padding-top:2px;">03</td>
                        <td style="padding-left:12px;font-size:13px;color:#888;line-height:1.5;">Mercenary profiles with voice lines and faction lore</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:20px;color:#f5a623;font-size:11px;font-weight:900;vertical-align:top;padding-top:2px;">04</td>
                        <td style="padding-left:12px;font-size:13px;color:#888;line-height:1.5;">53 ranks documented with EXP thresholds and emblem images</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:20px;color:#f5a623;font-size:11px;font-weight:900;vertical-align:top;padding-top:2px;">05</td>
                        <td style="padding-left:12px;font-size:13px;color:#888;line-height:1.5;">Verified ZP marketplace — compare sellers, check reviews, buy safe</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
                <tr>
                  <td align="center">
                    <a href="https://crossfire.wiki" target="_blank" style="display:inline-block;background:#f5a623;color:#000;text-decoration:none;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;padding:14px 40px;border-radius:2px;">
                      Visit CrossFire Wiki →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0 0 24px;" />

              <!-- Footer -->
              <p style="margin:0;font-size:11px;color:#444;line-height:1.6;">
                You received this because you subscribed to CrossFire Wiki updates.<br />
                CrossFire Wiki · <a href="https://crossfire.wiki" style="color:#f5a623;text-decoration:none;">crossfire.wiki</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default function EmailBlastPanel({ subscribers }: Props) {
  const { toast } = useToast();
  const [recipientType, setRecipientType] = useState<"subscribers" | "custom">("subscribers");
  const [customEmails, setCustomEmails] = useState("");
  const [subject, setSubject] = useState("CrossFire Wiki is Back — The Community Hub is Live");
  const [htmlBody, setHtmlBody] = useState(WIKI_BACK_TEMPLATE);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const subscriberEmails = subscribers.map((s) => s.email).filter(Boolean);

  const getRecipients = (): string[] => {
    if (recipientType === "subscribers") return subscriberEmails;
    return customEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
  };

  const recipients = getRecipients();

  const handleSend = async () => {
    if (!recipients.length) {
      toast({ title: "No recipients", description: "Add at least one email address.", variant: "destructive" });
      return;
    }
    if (!subject.trim()) {
      toast({ title: "Missing subject", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({ to: recipients, subject: subject.trim(), html: htmlBody, recipientType }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send");
      }
      setSent(true);
      toast({ title: `Sent to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Send failed", description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Email Blast</h2>
        <p className="text-sm mt-1" style={{ color: "#666" }}>Send announcements to subscribers or specific email addresses via Resend.</p>
      </div>

      {/* Recipients */}
      <div className="p-5 space-y-4" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
        <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#888" }}>Recipients</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setRecipientType("subscribers")}
            className="flex flex-col items-start gap-1 p-4 text-left transition-all"
            style={{
              background: recipientType === "subscribers" ? "rgba(245,166,35,0.08)" : "var(--background)",
              border: `1px solid ${recipientType === "subscribers" ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "3px",
            }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: "#f5a623" }} />
              <span className="text-[12px] font-black uppercase tracking-wide" style={{ color: "var(--foreground)" }}>All Subscribers</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">{subscriberEmails.length} emails</Badge>
          </button>
          <button
            onClick={() => setRecipientType("custom")}
            className="flex flex-col items-start gap-1 p-4 text-left transition-all"
            style={{
              background: recipientType === "custom" ? "rgba(245,166,35,0.08)" : "var(--background)",
              border: `1px solid ${recipientType === "custom" ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "3px",
            }}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: "#f5a623" }} />
              <span className="text-[12px] font-black uppercase tracking-wide" style={{ color: "var(--foreground)" }}>Custom List</span>
            </div>
            <span className="text-[10px]" style={{ color: "#555" }}>Paste emails manually</span>
          </button>
        </div>

        {recipientType === "custom" && (
          <div>
            <Textarea
              placeholder="one@example.com, two@example.com&#10;or one per line"
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              rows={4}
              className="font-mono text-xs"
            />
            <p className="text-[11px] mt-1" style={{ color: "#555" }}>
              {recipients.length} valid address{recipients.length !== 1 ? "es" : ""} detected
            </p>
          </div>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#888" }}>Subject Line</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
        />
      </div>

      {/* HTML Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#888" }}>Email HTML</Label>
          <button
            onClick={() => setPreviewOpen(!previewOpen)}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors"
            style={{ color: "#f5a623" }}
          >
            {previewOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {previewOpen ? "Hide Preview" : "Show Preview"}
          </button>
        </div>
        <Textarea
          value={htmlBody}
          onChange={(e) => setHtmlBody(e.target.value)}
          rows={12}
          className="font-mono text-xs"
          placeholder="Paste or edit HTML email body..."
        />
        <p className="text-[11px]" style={{ color: "#555" }}>
          The "Wiki is Back" template is pre-loaded. Edit or replace with any HTML.
        </p>
      </div>

      {/* Live preview */}
      {previewOpen && (
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#888" }}>Live Preview</Label>
          <div
            style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden", height: "500px" }}
          >
            <iframe
              srcDoc={htmlBody}
              title="Email preview"
              style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* Send button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSend}
          disabled={sending || sent || recipients.length === 0}
          className="flex items-center gap-2"
          style={{ background: sent ? "#16a34a" : "#f5a623", color: "#000" }}
        >
          {sending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
          ) : sent ? (
            <><CheckCircle className="h-4 w-4" /> Sent!</>
          ) : (
            <><Send className="h-4 w-4" /> Send to {recipients.length} Recipient{recipients.length !== 1 ? "s" : ""}</>
          )}
        </Button>
        {sent && (
          <button
            onClick={() => setSent(false)}
            className="text-[12px] font-bold uppercase tracking-wide"
            style={{ color: "#666" }}
          >
            Send Another
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="p-4 flex items-start gap-3" style={{ background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "3px" }}>
        <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#f5a623" }} />
        <div>
          <p className="text-[12px] font-bold mb-1" style={{ color: "var(--foreground)" }}>Sent via Resend</p>
          <p className="text-[11px] leading-relaxed" style={{ color: "#666" }}>
            Emails are sent from the verified sender configured in Resend using the Resend API. Make sure your domain is verified in Resend. The API key must be set as <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: "rgba(255,255,255,0.06)" }}>RESEND_API_KEY</code> in Vercel environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
