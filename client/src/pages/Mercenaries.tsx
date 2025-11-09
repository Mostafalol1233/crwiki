import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useState } from "react";

interface Mercenary {
  id: string;
  name: string;
  image: string;
  role: string;
}

export default function Mercenaries() {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: mercenaries = [], isLoading } = useQuery<Mercenary[]>({
    queryKey: ["/api/mercenaries"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent">
            {t("mercenaries").toUpperCase()}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("mercenariesSubtitle")}
          </p>
        </div>

        <div className="relative overflow-visible">
          <div className="flex justify-center gap-0">
            {mercenaries.map((merc) => (
              <div
                key={merc.id}
                className="relative group"
                style={{
                  width: "140px",
                  height: "450px",
                  flexShrink: 0,
                }}
                onMouseEnter={() => setHoveredId(merc.id)}
                onMouseLeave={() => setHoveredId(null)}
                data-testid={`mercenary-${merc.id}`}
              >
                <div
                  className="absolute inset-0 overflow-hidden transition-all duration-500"
                  style={{
                    transform: hoveredId === merc.id ? "scale(1.8)" : "scale(1)",
                    transformOrigin: "center center",
                    zIndex: hoveredId === merc.id ? 10 : 1,
                  }}
                >
                  <img
                    src={merc.image}
                    alt={merc.name}
                    className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ${
                      hoveredId === merc.id
                        ? "brightness-110"
                        : "brightness-75 grayscale-[50%]"
                    }`}
                  />
                  
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-500 ${
                      hoveredId === merc.id ? "opacity-100" : "opacity-70"
                    }`}
                  />

                  <div
                    className={`absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-500 ${
                      hoveredId === merc.id
                        ? "translate-y-0 opacity-100"
                        : "translate-y-4 opacity-0"
                    }`}
                  >
                    <h3 className="text-xl font-bold mb-2">{merc.name}</h3>
                    <p className="text-xs text-white/80 uppercase tracking-wider">
                      {merc.role}
                    </p>
                  </div>

                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                      hoveredId === merc.id
                        ? "opacity-0 scale-150"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <div
                      className="text-white text-center"
                      style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                      }}
                    >
                      <span className="text-sm font-bold tracking-widest">
                        {merc.name.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            SIA-SPECIAL
          </p>
        </div>
      </div>
    </div>
  );
}
