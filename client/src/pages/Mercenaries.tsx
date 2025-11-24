
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Layout, Grid3x3 } from "lucide-react";
import PageSEO from "@/components/PageSEO";

interface Mercenary {
  id: string;
  name: string;
  image: string;
  role: string;
  voiceLines?: string[];
}

export default function Mercenaries() {
  const { t } = useLanguage();
  const [playingMercId, setPlayingMercId] = useState<string | null>(null);
  const [layoutStyle, setLayoutStyle] = useState<"grid" | "separated">("grid");
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const lastSoundRef = useRef<{ [key: string]: string | null }>({});

  const { data: mercenaries = [], isLoading } = useQuery<Mercenary[]>({
    queryKey: ["/api/mercenaries"],
  });

  const playRandomSound = (mercId: string, voiceLines?: string[]) => {
    if (!voiceLines || voiceLines.length === 0) return;

    let randomSound = voiceLines[Math.floor(Math.random() * voiceLines.length)];
    const last = lastSoundRef.current[mercId];
    if (voiceLines.length > 1 && last) {
      let attempts = 0;
      while (randomSound === last && attempts < 5) {
        randomSound = voiceLines[Math.floor(Math.random() * voiceLines.length)];
        attempts++;
      }
    }
    lastSoundRef.current[mercId] = randomSound;

    if (playingMercId && audioRefs.current[playingMercId]) {
      audioRefs.current[playingMercId].pause();
      audioRefs.current[playingMercId].currentTime = 0;
    }

    if (!audioRefs.current[mercId]) {
      audioRefs.current[mercId] = new Audio();
    }

    const audio = audioRefs.current[mercId];
    audio.src = randomSound;
    audio.play().catch((err) => console.error("Audio play error:", err));
    
    setPlayingMercId(mercId);
    
    audio.onended = () => {
      setPlayingMercId(null);
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={"Mercenaries — CrossFire Wiki"}
        description={"Browse CrossFire mercenaries with roles and voice lines."}
        canonicalPath="/mercenaries"
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="flex items-center justify-between mb-12">
          <div className="text-center flex-1">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent">
              {t("mercenaries").toUpperCase()}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("mercenariesSubtitle")}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              size="icon"
              variant={layoutStyle === "grid" ? "default" : "outline"}
              onClick={() => setLayoutStyle("grid")}
              title="Grid layout"
              className="hover:bg-primary/80"
            >
              <Grid3x3 className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant={layoutStyle === "separated" ? "default" : "outline"}
              onClick={() => setLayoutStyle("separated")}
              title="Separated layout"
              className="hover:bg-primary/80"
            >
              <Layout className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div>
          {layoutStyle === "grid" ? (
            // Grid layout (original style)
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              {mercenaries.map((merc) => (
                <div
                  key={merc.id}
                  className="relative group h-96 cursor-pointer"
                  data-testid={`mercenary-${merc.id}`}
                >
                  <div
                    className="absolute inset-0 overflow-hidden transition-all duration-500 rounded-lg"
                  >
                    <img
                      src={merc.image}
                      alt={merc.name}
                      className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-110"
                    />
                    
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/80 group-hover:via-black/30"
                    />

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                      <h3 className="text-lg font-bold mb-1">{merc.name}</h3>
                      <p className="text-xs text-white/80 uppercase tracking-wider">
                        {merc.role}
                      </p>
                    </div>

                    {merc.voiceLines && merc.voiceLines.length > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <Button
                          size="lg"
                          onClick={() => playRandomSound(merc.id, merc.voiceLines)}
                          className="bg-primary/95 hover:bg-primary text-white font-semibold transition-all duration-200"
                        >
                          {playingMercId === merc.id ? (
                            <>
                              <VolumeX className="h-5 w-5 mr-2" />
                              Playing...
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-5 w-5 mr-2" />
                              Voice
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Separated layout (like Crossfire z8games - full width rows)
            <div className="space-y-4 w-full">
              {mercenaries.map((merc) => (
                <div
                  key={merc.id}
                  className="relative group h-40 md:h-48 cursor-pointer border border-border rounded-lg overflow-hidden"
                  data-testid={`mercenary-separated-${merc.id}`}
                >
                  <div className="flex h-full">
                    {/* Image */}
                    <div className="w-1/4 md:w-1/6 overflow-hidden">
                      <img
                        src={merc.image}
                        alt={merc.name}
                        className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-110"
                      />
                    </div>

                    {/* Info area */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-r from-black/40 to-transparent relative z-10">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{merc.name}</h3>
                        <p className="text-sm md:text-base text-white/80 uppercase tracking-wider font-semibold">
                          {merc.role}
                        </p>
                      </div>

                      {merc.voiceLines && merc.voiceLines.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => playRandomSound(merc.id, merc.voiceLines)}
                            className="bg-primary/95 hover:bg-primary text-white font-semibold transition-all duration-200"
                          >
                            {playingMercId === merc.id ? (
                              <>
                                <VolumeX className="h-4 w-4 mr-2" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4 mr-2" />
                                Play Voice
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/40"
                      style={{ pointerEvents: "none" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            SIA-SPECIAL
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
