import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface CategoryPreviewProps {
  title: string;
  description: string;
  image: string;
  stats?: { label: string; value: string }[];
  reverse?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

export function CategoryPreview({
  title,
  description,
  image,
  stats,
  reverse = false,
  ctaText = "Explore More",
  ctaLink,
}: CategoryPreviewProps) {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:flex-row-reverse" : ""}`}>
          <motion.div
            initial={{ opacity: 0, x: reverse ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={reverse ? "lg:order-2" : ""}
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {description}
            </p>
            
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
                    <div className="text-3xl font-heading font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {ctaLink && (
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold"
                onClick={() => window.location.href = ctaLink}
              >
                {ctaText}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reverse ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={reverse ? "lg:order-1" : ""}
          >
            <Card className="relative overflow-hidden group border-border/50">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
