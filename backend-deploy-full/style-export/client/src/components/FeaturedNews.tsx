import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { NewsPost } from "@shared/schema";

interface FeaturedNewsProps {
  posts: NewsPost[];
}

export function FeaturedNews({ posts }: FeaturedNewsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-4">
            Latest <span className="text-primary">News</span> & Updates
          </h2>
          <p className="text-center text-muted-foreground text-lg">
            Stay updated with the latest events, patches, and community highlights
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer border-border/50 ${
                  index === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
                data-testid={`card-news-${post.id}`}
              >
                <div className={`relative w-full ${index === 0 ? "h-96" : "h-64"} overflow-hidden`}>
                  <img
                    src={post.image}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <Badge 
                      className="backdrop-blur-sm bg-primary/90 text-primary-foreground border-primary/30"
                      data-testid={`badge-category-${post.category.toLowerCase()}`}
                    >
                      {post.category}
                    </Badge>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className={`font-heading font-bold mb-2 ${index === 0 ? "text-3xl" : "text-xl"}`}>
                      {post.title}
                    </h3>
                    <p className="text-sm text-white/80 mb-2 line-clamp-2">{post.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-white/70">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
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
