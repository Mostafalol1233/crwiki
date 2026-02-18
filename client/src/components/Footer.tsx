import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SiX, SiYoutube, SiWhatsapp } from "react-icons/si";
import { Mail, Gamepad2, BookOpen } from "lucide-react";

export function Footer() {
  const { toast } = useToast();
  const mainLinks = [
    { label: "Home", path: "/" },
    { label: "Weapons", path: "/weapons" },
    { label: "Mercenaries", path: "/mercenaries" },
    { label: "Modes", path: "/modes" },
    { label: "Ranks", path: "/ranks" },
    { label: "Download", path: "/download" },
  ];

  const contentLinks = [
    { label: "News & Updates", path: "/news" },
    { label: "Posts", path: "/posts" },
    { label: "Videos", path: "/videos" },
    { label: "Events", path: "https://crossfire.wiki/category/events" },
  ];

  const supportLinks = [
    { label: "Support", path: "/support" },
    { label: "My Tickets", path: "/my-tickets" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <footer className="relative border-t bg-gradient-to-b from-background to-muted/30">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src="https://images.seeklogo.com/logo-png/42/1/crossfire-logo-png_seeklogo-429200.png" 
                  alt="CrossFire Official Logo" 
                  className="h-10 w-auto object-contain"
                />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                  Wiki
                </h3>
              </div>
              <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest">
                by Bimora Gaming
              </p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              The ultimate competitive gaming resource. Master weapons, mercenaries, game modes, rankings, and strategies with data-driven insights and expert analysis.
            </p>

            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Follow Us
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.youtube.com/@Bemora-site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all duration-300"
                  data-testid="link-social-youtube"
                  aria-label="Visit Bimora Gaming YouTube channel"
                  title="YouTube"
                >
                  <SiYoutube className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com/Bemora_BEMO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all duration-300"
                  data-testid="link-social-x"
                  aria-label="Visit Bimora Gaming X (Twitter) profile"
                  title="X / Twitter"
                >
                  <SiX className="h-5 w-5" />
                </a>
                <a
                  href="https://chat.whatsapp.com/IQ7DtUTV87w0uISZQETBZe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all duration-300"
                  data-testid="link-social-whatsapp"
                  aria-label="Join our WhatsApp Community"
                  title="WhatsApp Community"
                >
                  <SiWhatsapp className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-primary" />
              Game
            </h4>
            <ul className="space-y-3">
              {mainLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-1 inline-block"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Content Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Content
            </h4>
            <ul className="space-y-3">
              {contentLinks.map((link) => (
                <li key={link.path}>
                  {String(link.path).startsWith("http") ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-1 inline-block"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.path}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-1 inline-block"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Support
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-1 inline-block"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-16 border-b">
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-4">Get in Touch</h4>
            <a
              href="mailto:support@crossfire.wiki"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-300 group"
            >
              <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
              support@crossfire.wiki
            </a>
          </div>

          <div className="md:text-right">
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-4">Subscribe</h4>
            <p className="text-xs text-muted-foreground mb-3">Get exclusive game updates and tips</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.elements.namedItem("email") as HTMLInputElement;
                const email = emailInput?.value;
                if (email) {
                  try {
                    const res = await fetch("/api/newsletter-subscribe", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    if (res.ok) {
                      toast({ 
                        title: "Subscribed!", 
                        description: "You have successfully subscribed to our newsletter." 
                      });
                      form.reset();
                    } else {
                      toast({ 
                        title: "Subscription failed", 
                        description: "Please try again later.", 
                        variant: "destructive" 
                      });
                    }
                  } catch (err) {
                    toast({ 
                      title: "Error", 
                      description: "Something went wrong.", 
                      variant: "destructive" 
                    });
                  }
                }
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                required
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-muted-foreground/20 bg-muted/50 focus:bg-background focus:border-primary outline-none transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-300"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2025 CrossFire Wiki by Bimora Gaming. All rights reserved.
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-300"
              data-testid="link-footer-terms"
            >
              Terms of Service
            </Link>
            <div className="h-4 w-px bg-muted-foreground/20" />
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-300"
              data-testid="link-footer-privacy"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
