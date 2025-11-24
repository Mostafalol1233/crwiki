
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import PageSEO from "@/components/PageSEO";

interface Mercenary {
  id: string;
  name: string;
  image: string;
  role: string;
  voiceLines?: string[]; // Changed from sounds to voiceLines
}

export default function Mercenaries() {
  const { t } = useLanguage();
  const [playingMercId, setPlayingMercId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const lastSoundRef = useRef<{ [key: string]: string | null }>({});

  const { data: mercenaries = [], isLoading } = useQuery<Mercenary[]>({
    queryKey: ["/api/mercenaries"],
  });

  const playRandomSound = (mercId: string, voiceLines?: string[]) => {
    if (!voiceLines || voiceLines.length === 0) return;

    // Pick a random sound (avoid repeating the last one when possible)
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

    // Stop current audio if any
    if (playingMercId && audioRefs.current[playingMercId]) {
      audioRefs.current[playingMercId].pause();
      audioRefs.current[playingMercId].currentTime = 0;
    }

    // Create or get audio element
    if (!audioRefs.current[mercId]) {
      audioRefs.current[mercId] = new Audio();
    }

    const audio = audioRefs.current[mercId];
    audio.src = randomSound;
    audio.play().catch((err) => console.error("Audio play error:", err));
    
    setPlayingMercId(mercId);
    
    // Reset after audio ends
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
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent">
            {t("mercenaries").toUpperCase()}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("mercenariesSubtitle")}
          </p>
        </div>

        <div>
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

                  {/* Info at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                    <h3 className="text-lg font-bold mb-1">{merc.name}</h3>
                    <p className="text-xs text-white/80 uppercase tracking-wider">
                      {merc.role}
                    </p>
                  </div>

                  {/* Sound button - appears on hover */}
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
