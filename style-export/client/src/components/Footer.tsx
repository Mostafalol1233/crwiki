import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="text-xl font-heading font-bold mb-4">CrossFire West</h3>
            <p className="text-muted-foreground text-sm mb-4">
              CrossFire is a fast-paced free-to-play first person shooter, pitting two teams against each other. Join millions of players worldwide in the ultimate FPS experience.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2024 CrossFire West by Z8Games. All rights reserved.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/download" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Download
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://help.z8games.com/hc/en-us/articles/38954103503515-How-do-I-download-and-install-CrossFire" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Installation Guide
                </a>
              </li>
              <li>
                <a 
                  href="https://help.z8games.com/hc/en-us/categories/37856722020635-CrossFire" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a 
                  href="https://www.z8games.com/signup.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Create Account
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/50 pt-8">
          <p className="text-center text-xs text-muted-foreground">
            CrossFire® is a registered trademark of Smilegate. This fan site is not affiliated with or endorsed by Smilegate or Z8Games.
          </p>
        </div>
      </div>
    </footer>
  );
}
