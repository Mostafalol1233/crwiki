import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { Mercenary } from "@shared/schema";

interface MercenaryGalleryProps {
  mercenaries: Mercenary[];
}

export function MercenaryGallery({ mercenaries }: MercenaryGalleryProps) {
  if (mercenaries.length === 0) {
    return null;
  }

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-muted/20 via-background to-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Elite <span className="text-primary">Mercenaries</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose from a diverse roster of elite special forces operatives, each with unique abilities and specialties
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {mercenaries.map((merc, index) => (
            <motion.div
              key={merc.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card
                className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer border-border/50"
                data-testid={`card-mercenary-${merc.id}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-muted/30 to-background">
                  <img
                    src={merc.image}
                    alt={merc.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  <div className="absolute top-3 right-3">
                    <Badge 
                      variant="secondary"
                      className="backdrop-blur-sm bg-background/80 text-foreground border-border/50"
                    >
                      {merc.faction}
                    </Badge>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-heading font-bold text-white text-lg mb-1">
                      {merc.name}
                    </h3>
                    {merc.specialty && (
                      <p className="text-xs text-white/80 line-clamp-2">
                        {merc.specialty}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
