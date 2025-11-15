import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Download } from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/generated_images/Gaming_Logo_fe78100d.png";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: "/", label: "Home" },
    { path: "/download", label: "Download" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" data-testid="link-logo">
            <div className="relative h-10 w-10 md:h-12 md:w-12">
              <img
                src={logoImage}
                alt="CrossFire West"
                className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300"
                data-testid="img-logo"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg md:text-xl font-heading font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                CROSSFIRE WEST
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-wider">
                FREE TO PLAY FPS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`font-heading font-semibold ${
                    location === item.path 
                      ? "text-primary bg-primary/10" 
                      : "text-foreground hover:text-primary hover:bg-accent/10"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/download">
              <Button
                size="default"
                className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold shadow-lg shadow-primary/20"
                data-testid="button-download-header"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Now
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t py-4 space-y-2">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start font-heading ${
                    location === item.path 
                      ? "text-primary bg-primary/10" 
                      : "text-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href="/download">
              <Button
                size="default"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Now
              </Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
