import { ArticleCard } from "../ArticleCard";
import { LanguageProvider } from "../LanguageProvider";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";

export default function ArticleCardExample() {
  const article = {
    id: "2",
    title: "Complete Guide to TypeScript Generics",
    summary: "Master TypeScript generics with practical examples and best practices for building reusable components.",
    category: "Tutorials",
    image: tutorialImage,
    author: "Sarah Johnson",
    date: "Jan 12, 2025",
    readingTime: 6,
    views: 8230,
    tags: ["TypeScript", "Programming", "Web Dev"],
    featured: true
  };

  return (
    <LanguageProvider>
      <div className="max-w-sm">
        <ArticleCard article={article} />
      </div>
    </LanguageProvider>
  );
}
