import { Link } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "./LanguageProvider";
import { SiX, SiYoutube } from "react-icons/si";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/newsletter-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Subscription failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Successfully subscribed to newsletter!" });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Subscription failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      subscribeMutation.mutate(email);
    }
  };

  const quickLinks = [
    { label: t("home"), path: "/" },
    { label: t("news"), path: "/news" },
    { label: t("events"), path: "/events" },
    { label: t("tutorials"), path: "/tutorials" },
    { label: t("mercenaries"), path: "/mercenaries" },
    { label: t("support"), path: "/support" },
    { label: t("sellers"), path: "/sellers" },
    { label: t("reviews"), path: "/reviews" },
    { label: t("about"), path: "/about" },
    { label: t("contact"), path: "/contact" },
    { label: "Terms of Service", path: "/terms" },
    { label: "Privacy Policy", path: "/privacy" },
  ];

  return (
    <footer className="border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent mb-4">
              Bimora
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your source for CrossFire gaming news and community updates.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">
              Newsletter
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to get the latest articles delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9"
                data-testid="input-newsletter-email"
              />
              <Button 
                size="sm" 
                type="submit"
                disabled={subscribeMutation.isPending}
                data-testid="button-newsletter-submit"
              >
                {subscribeMutation.isPending ? "..." : t("submit")}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            {t("copyright")}
          </p>

          <div className="flex items-center gap-4">
            <a
                href="https://www.youtube.com/@Bemora-site"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-social-youtube"
            >
                <SiYoutube className="h-5 w-5" />
            </a>
            <a
                href="https://twitter.com/Bemora_BEMO"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-social-x"
            >
              <SiX className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
