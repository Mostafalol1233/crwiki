import { Sidebar } from "../Sidebar";
import { LanguageProvider } from "../LanguageProvider";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";

export default function SidebarExample() {
  const recentPosts = [
    { id: "1", title: "Getting Started with Next.js 14", image: tutorialImage, date: "2 days ago" },
    { id: "2", title: "CSS Grid Layout Mastery", image: tutorialImage, date: "4 days ago" },
    { id: "3", title: "API Design Best Practices", image: tutorialImage, date: "1 week ago" },
  ];

  const popularTags = [
    { name: "React", count: 45 },
    { name: "TypeScript", count: 38 },
    { name: "CSS", count: 32 },
    { name: "JavaScript", count: 56 },
  ];

  const mostViewed = [
    { id: "1", title: "Understanding React Hooks in Depth", views: 25400 },
    { id: "2", title: "Modern CSS Techniques", views: 18900 },
    { id: "3", title: "Building REST APIs with Node.js", views: 16200 },
  ];

  const bimoraPicks = [
    { id: "1", title: "The Future of Web Development", image: tutorialImage, date: "Jan 10" },
    { id: "2", title: "Microservices Architecture Guide", image: tutorialImage, date: "Jan 8" },
  ];

  return (
    <LanguageProvider>
      <div className="max-w-sm">
        <Sidebar
          recentPosts={recentPosts}
          popularTags={popularTags}
          mostViewed={mostViewed}
          bimoraPicks={bimoraPicks}
        />
      </div>
    </LanguageProvider>
  );
}
