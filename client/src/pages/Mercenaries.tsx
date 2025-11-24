
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
  voiceLines?: string[];
}

export default function Mercenaries() {
  const { t } = useLanguage();
  const [playingMercId, setPlayingMercId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const lastSoundRef = useRef<{ [key: string]: string | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      <div className="max-w-full mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent">
            {t("mercenaries").toUpperCase()}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("mercenariesSubtitle")}
          </p>
        </div>

        {/* Horizontal scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 md:gap-4 overflow-x-auto pb-6 px-2 snap-x snap-mandatory"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {mercenaries.map((merc) => (
            <div
              key={merc.id}
              className="flex-shrink-0 snap-start group relative h-96 md:h-[28rem] w-64 md:w-72 lg:w-80 cursor-pointer overflow-hidden rounded-lg border border-border/40 hover:border-primary/60 transition-all duration-300"
              data-testid={`mercenary-${merc.id}`}
            >
              {/* Background image */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={merc.image}
                  alt={merc.name}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/70 group-hover:via-black/20" />

              {/* Info at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white z-10 flex flex-col gap-3">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-1 line-clamp-2">{merc.name}</h3>
                  <p className="text-xs md:text-sm text-white/80 uppercase tracking-wider font-semibold">
                    {merc.role}
                  </p>
                </div>

                {/* Sound button */}
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
            </div>
          ))}
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
