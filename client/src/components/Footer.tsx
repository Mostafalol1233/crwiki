import { Link } from "wouter";
import { SiX, SiYoutube, SiWhatsapp } from "react-icons/si";
import { Mail, Zap, Users, Gamepad2, Award, BookOpen } from "lucide-react";

export function Footer() {
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
    { label: "Tutorials", path: "/tutorials" },
    { label: "Events", path: "/events" },
  ];

  const supportLinks = [
    { label: "Support", path: "/support" },
    { label: "My Tickets", path: "/my-tickets" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  const features = [
    { icon: Zap, label: "Instant Access", desc: "Real-time game data updates" },
    { icon: Users, label: "Community", desc: "Join thousands of players" },
    { icon: Award, label: "Expert Guides", desc: "From experienced players" },
  ];

  return (
    <footer className="relative border-t bg-gradient-to-b from-background to-muted/30">
      {/* Top CTA Section */}
      <div className="border-b bg-gradient-to-r from-primary/10 to-destructive/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/20 p-3 mt-1">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-gradient-to-br from-primary to-destructive p-2">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                  CrossFire Wiki
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

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
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
              onSubmit={(e) => {
                e.preventDefault();
                const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement)?.value;
                if (email) {
                  fetch("/api/newsletter-subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  }).catch(() => {});
                  (e.target as HTMLFormElement).reset();
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
