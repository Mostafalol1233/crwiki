import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CarouselItem } from "@shared/schema";

interface HeroCarouselProps {
  items: CarouselItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (items.length === 0) {
    return (
      <section className="relative h-screen w-full bg-gradient-to-b from-background via-background/95 to-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-heading font-bold text-foreground mb-4">
            CrossFire West
          </h1>
          <p className="text-xl text-muted-foreground">
            Join the FPS Revolution
          </p>
        </div>
      </section>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <section 
      className="relative h-screen w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="hero-carousel"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentItem.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 leading-tight tracking-tight"
            data-testid={`carousel-title-${currentIndex}`}
          >
            {currentItem.title}
          </motion.h1>
          {currentItem.subtitle && (
            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {currentItem.subtitle}
            </motion.p>
          )}
          {(currentItem.link || currentItem.ctaText) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 backdrop-blur-sm border-2 border-primary/30 shadow-lg shadow-primary/20"
                onClick={() => {
                  if (currentItem.link) {
                    window.location.href = currentItem.link;
                  }
                }}
                data-testid={`carousel-cta-${currentIndex}`}
              >
                <Download className="mr-2 h-5 w-5" />
                {currentItem.ctaText || "Learn More"}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {items.length > 1 && (
        <>
          <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 text-white"
              onClick={goToPrev}
              data-testid="carousel-prev"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 text-white"
              onClick={goToNext}
              data-testid="carousel-next"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "w-12 bg-primary shadow-lg shadow-primary/50" 
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                data-testid={`carousel-dot-${index}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
