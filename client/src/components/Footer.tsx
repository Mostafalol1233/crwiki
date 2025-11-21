import { Link } from "wouter";
import { SiX, SiYoutube } from "react-icons/si";

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

  return (
    <footer className="border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent mb-4">
              Bimora Gaming
            </h3>
            <h4 className="text-lg font-semibold mb-2">CrossFire.Wiki</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              by Bimora Gaming<br />
              Your ultimate CrossFire gaming resource. Explore weapons, mercenaries, game modes, ranks, tutorials, and more.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.youtube.com/@Bemora-site"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-social-youtube"
                aria-label="Visit Bimora Gaming YouTube channel"
              >
                <SiYoutube className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/Bemora_BEMO"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-social-x"
                aria-label="Visit Bimora Gaming X (Twitter) profile"
              >
                <SiX className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {mainLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">
              Content
            </h4>
            <ul className="space-y-2.5">
              {contentLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              support@crossfire.wiki
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © 2025 CrossFire Wiki by Bimora Gaming. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
