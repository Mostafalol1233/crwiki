import { Download, Cpu, Zap, HardDrive, Monitor, CircleDot, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DownloadPage() {
  const specs = [
    {
      category: "Processor (CPU)",
      icon: Cpu,
      items: [
        {
          label: "Minimum:",
          specs: [
            "AMD Athlon™ 64 X2 Dual Core Processor 4600+ 2.4GHz",
            "Intel® Core™2 Duo Processor T6400 2.0GHz",
          ],
        },
        {
          label: "Recommended:",
          specs: [
            "AMD Ryzen™ 3 1200 Processor @ 3.1GHz (4 Cores), ~3.4GHz",
            "Intel® Core™ i5-3470 Processor @ 3.20GHz (4 Cores), ~3.2GHz",
          ],
        },
      ],
    },
    {
      category: "Memory (RAM)",
      icon: Zap,
      items: [
        { label: "Minimum:", specs: ["4 GB"] },
        { label: "Recommended:", specs: ["8 GB"] },
      ],
    },
    {
      category: "Video Card",
      icon: Monitor,
      items: [
        {
          label: "Minimum:",
          specs: [
            "NVIDIA® GeForce® 9500 GT",
            "AMD Radeon™ HD 6450",
            "Intel® HD Graphics 3000",
          ],
        },
        {
          label: "Recommended:",
          specs: [
            "NVIDIA® GeForce® GT 630",
            "AMD Radeon™ HD 6570",
            "Intel® HD Graphics 6000",
          ],
        },
      ],
    },
    {
      category: "Storage (HDD)",
      icon: HardDrive,
      items: [
        { label: "Minimum:", specs: ["15 GB of free space"] },
      ],
    },
    {
      category: "Operating System",
      icon: CircleDot,
      items: [
        { label: "Minimum:", specs: ["Windows 7/8/10 64-bit"] },
      ],
    },
    {
      category: "DirectX©",
      icon: Zap,
      items: [
        { label: "Minimum:", specs: ["DirectX© 9.0c"] },
        { label: "Recommended:", specs: ["DirectX© 9.0c or higher"] },
      ],
    },
    {
      category: "Internet Connection",
      icon: CircleDot,
      items: [
        { label: "Minimum:", specs: ["Cable/DSL"] },
        { label: "Recommended:", specs: ["Cable / DSL or better"] },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-background/80 overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 top-0 h-96 w-full overflow-hidden -z-5">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://z8games.akamaized.net/cfna/templates/assets/images/feature-comp.jpg)",
            opacity: 0.05,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/20 to-background" />
      </div>

      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.9),transparent_60%)] opacity-40 blur-3xl mix-blend-screen fire-glow-strong" />
        <div className="absolute -bottom-32 -right-24 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(252,211,77,0.9),transparent_60%)] opacity-40 blur-3xl mix-blend-screen fire-glow-soft" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Download className="h-8 w-8 text-destructive" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              Download CrossFire
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Official Downloader — Get CrossFire today and join the action
          </p>
          <Button
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-white font-semibold tracking-wide uppercase px-3 py-1.5 text-xs shadow-lg"
          >
            Download Now
          </Button>
        </div>

        {/* System Requirements */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-foreground">
            System Requirements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specs.map((spec, idx) => {
              const Icon = spec.icon;
              return (
                <Card
                  key={idx}
                  className="bg-gradient-to-br from-card to-card/70 border-border/60 hover:border-primary/70 transition-all duration-300 hover-elevate overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-6 w-6 text-destructive" />
                      <CardTitle className="text-lg">{spec.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {spec.items.map((item, itemIdx) => (
                      <div key={itemIdx}>
                        <p className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          {item.label}
                        </p>
                        <ul className="space-y-1 ml-2">
                          {item.specs.map((s, specIdx) => (
                            <li
                              key={specIdx}
                              className="text-sm text-muted-foreground leading-relaxed"
                            >
                              • {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-destructive/20 via-primary/10 to-destructive/20 rounded-lg border border-destructive/30 p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
            Ready to join the battle?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Download CrossFire now and experience intense multiplayer action. Check the system requirements above to ensure your PC meets the minimum specifications.
          </p>
          <Button
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-white font-semibold tracking-wide uppercase px-3 py-1.5 text-xs shadow-lg"
          >
            <Download className="mr-2 h-3 w-3" />
            Download CrossFire
          </Button>
        </div>
      </div>
    </div>
  );
}
