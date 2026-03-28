import { Download, Cpu, Zap, HardDrive, Monitor, CircleDot, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";

export default function DownloadPage() {
  const { t } = useLanguage();
  const downloadUrl = "https://crossfire.z8games.com/download.html";
  const patchNotesUrl = "https://crossfire.z8games.com/news.html";

  const specs = [
    {
      category: "Processor (CPU)",
      icon: Cpu,
      items: [
        {
          label: t("minimum"),
          specs: [
            "AMD Athlon™ 64 X2 Dual Core Processor 4600+ 2.4GHz",
            "Intel® Core™2 Duo Processor T6400 2.0GHz",
          ],
        },
        {
          label: t("recommended"),
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
        { label: t("minimum"), specs: ["4 GB"] },
        { label: t("recommended"), specs: ["8 GB"] },
      ],
    },
    {
      category: "Video Card",
      icon: Monitor,
      items: [
        {
          label: t("minimum"),
          specs: [
            "NVIDIA® GeForce® 9500 GT",
            "AMD Radeon™ HD 6450",
            "Intel® HD Graphics 3000",
          ],
        },
        {
          label: t("recommended"),
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
        { label: t("minimum"), specs: ["15 GB of free space"] },
      ],
    },
    {
      category: "Operating System",
      icon: CircleDot,
      items: [
        { label: t("minimum"), specs: ["Windows 7/8/10 64-bit"] },
      ],
    },
    {
      category: "DirectX©",
      icon: Zap,
      items: [
        { label: t("minimum"), specs: ["DirectX© 9.0c"] },
        { label: t("recommended"), specs: ["DirectX© 9.0c or higher"] },
      ],
    },
    {
      category: "Internet Connection",
      icon: CircleDot,
      items: [
        { label: t("minimum"), specs: ["Cable/DSL"] },
        { label: t("recommended"), specs: ["Cable / DSL or better"] },
      ],
    },
  ];

  return (
    <>
      <PageSEO
        title={"Download — CrossFire West Wiki"}
        description={"Download CrossFire West (crossfirewest) — the North American server by Z8Games. Learn about in-game events, missions, and system requirements."}
        canonicalPath="/download"
        schemaType="WebPage"
        schemaData={{
          name: "CrossFire West Download",
          description: "Download CrossFire West and learn about events and missions.",
          url: "/download",
        }}
      />
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
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Download className="h-8 w-8 text-destructive" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              CrossFire West
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
            {t("officialInstallerDesc")}
          </p>
          <Button
            asChild
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-white font-semibold tracking-wide uppercase px-3 py-1.5 text-xs shadow-lg"
          >
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              {t("downloadNow")}
            </a>
          </Button>
        </div>

        {/* Important notice */}
        <div className="mb-10 p-5 rounded-lg border border-primary/40 bg-primary/5 flex gap-4 items-start max-w-3xl mx-auto">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-foreground mb-1">
              هذا الموقع عن CrossFire West (crossfirewest) — مش إصدار جديد
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              بنشرح للاعبين الأيفنتات والمهمات والمحتوى الموجود داخل اللعبة. مش بنقدم أي نسخة جديدة أو تعديلات — فقط معلومات وشرح عن اللعبة الأصلية الخاصة بـ Z8Games.
            </p>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{t("officialInstaller")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t("officialInstallerDesc")}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{t("checkUpdatesFirst")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t("checkUpdatesDesc")}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{t("useEnoughStorage")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t("useEnoughStorageDesc")}
            </CardContent>
          </Card>
        </div>

        {/* System Requirements */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-foreground">
            {t("systemRequirements")}
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
            {t("readyToJoin")}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t("readyToJoinDesc")}
          </p>
          <Button
            asChild
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-white font-semibold tracking-wide uppercase px-3 py-1.5 text-xs shadow-lg"
          >
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-3 w-3" />
              {t("downloadCrossFire")}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="ml-3">
            <a href={patchNotesUrl} target="_blank" rel="noreferrer">
              {t("latestAnnouncements")}
            </a>
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
