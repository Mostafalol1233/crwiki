
import { useQuery } from "@tanstack/react-query";
import { getMercenaries } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Grid3x3, Zap, StopCircle } from "lucide-react";
import PageSEO from "@/components/PageSEO";

interface Mercenary {
  id: string;
  name: string;
  image: string;
  role: string;
  voiceLines?: string[];
}

const mercenaryImageByName: Record<string, string> = {
  wolf: "https://files.catbox.moe/6npa73.jpeg",
  vipers: "https://files.catbox.moe/4il6hi.jpeg",
  sisterhood: "https://files.catbox.moe/3o58nb.jpeg",
  "black mamba": "https://files.catbox.moe/r26ox6.jpeg",
  "arch honorary": "https://files.catbox.moe/ctwnqz.jpeg",
  desperado: "https://files.catbox.moe/hh7h5u.jpeg",
  ronin: "https://files.catbox.moe/eck3jc.jpeg",
  dean: "https://files.catbox.moe/t78mvu.jpeg",
  thoth: "https://files.catbox.moe/g4zfzn.jpeg",
  sfg: "https://files.catbox.moe/3bba2g.jpeg",
};

function resolveMercImage(merc: Mercenary) {
  const image = String(merc.image || "").trim();
  if (/^https?:\/\//i.test(image)) return image;

  const key = String(merc.name || "").toLowerCase().trim();
  if (mercenaryImageByName[key]) return mercenaryImageByName[key];

  if (image.startsWith('/assets/merc-blackmamba')) {
    return "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/merc-blackmamba.jpg";
  }

  return mercenaryImageByName["wolf"];
}

export default function Mercenaries() {
  const { t } = useLanguage();
  const [playingMercId, setPlayingMercId] = useState<string | null>(null);
  const [layoutStyle, setLayoutStyle] = useState<"strip" | "grid">("strip");
  const [expandedMercId, setExpandedMercId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const lastSoundRef = useRef<{ [key: string]: string | null }>({});
  const [stopFlash, setStopFlash] = useState(false);

  const { data: mercenaries = [], isLoading } = useQuery<Mercenary[]>({
    queryKey: ["/api/mercenaries"],
    queryFn: getMercenaries,
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

  const stopAllAudio = () => {
    try {
      Object.values(audioRefs.current).forEach((audio) => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
      });
      setPlayingMercId(null);
      setStopFlash(true);
      setTimeout(() => setStopFlash(false), 250);
    } catch {}
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Space") {
        e.preventDefault();
        stopAllAudio();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
              variant={layoutStyle === "strip" ? "default" : "outline"}
              onClick={() => setLayoutStyle("strip")}
              title="Strip layout"
              className="hover:bg-primary/80"
            >
              <Zap className="h-5 w-5" />
            </Button>
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
              title="Stop all mercenary audio (Esc/Space)"
              onClick={stopAllAudio}
              className={`w-10 h-10 ${stopFlash ? "bg-destructive text-white" : "bg-muted hover:bg-destructive/80"}`}
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div>
          {layoutStyle === "strip" ? (
            // Strip layout - NO GAPS, characters stick together, fill entire width
            <div className="flex gap-0 overflow-x-auto w-full rounded-lg border border-border/20 bg-black/20 backdrop-blur-sm" style={{ height: "450px" }}>
              {mercenaries.map((merc) => (
                <div
                  key={merc.id}
                  className={`relative flex-shrink-0 group cursor-pointer overflow-hidden transition-all duration-300 ${
                    expandedMercId === merc.id
                      ? "flex-grow min-w-80"
                      : "min-w-24"
                  }`}
                  onMouseEnter={() => setExpandedMercId(merc.id)}
                  onMouseLeave={() => setExpandedMercId(null)}
                  data-testid={`mercenary-strip-${merc.id}`}
                >
                  {/* Background image */}
                  <img
                    src={resolveMercImage(merc)}
                    alt={merc.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = mercenaryImageByName["wolf"]; }}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Content - only visible when expanded */}
                  {expandedMercId === merc.id && (
                    <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 text-white z-10 animate-in fade-in duration-200">
                      <div className="mb-4">
                        <h3 className="text-2xl md:text-3xl font-bold mb-1">{merc.name}</h3>
                        <p className="text-sm md:text-base text-white/80 uppercase tracking-wider font-semibold">
                          {merc.role}
                        </p>
                      </div>

                      {merc.voiceLines && merc.voiceLines.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => playRandomSound(merc.id, merc.voiceLines)}
                          className="bg-primary/90 hover:bg-primary text-white font-semibold transition-all duration-200 w-full"
                        >
                          {playingMercId === merc.id ? (
                            <>
                              <VolumeX className="h-4 w-4 mr-2" />
                              Playing...
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 mr-2" />
                              Voice
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Grid layout - cards
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              {mercenaries.map((merc) => (
                <div
                  key={merc.id}
                  className="relative group h-96 cursor-pointer"
                  data-testid={`mercenary-grid-${merc.id}`}
                >
                  <div
                    className="absolute inset-0 overflow-hidden transition-all duration-500 rounded-lg"
                  >
                    <img
                      src={resolveMercImage(merc)}
                      alt={merc.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = mercenaryImageByName["wolf"]; }}
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
