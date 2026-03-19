import { HeroSection } from "../HeroSection";
import { LanguageProvider } from "../LanguageProvider";

export default function HeroSectionExample() {
  const heroPost = {
    id: "1",
    title: "Building Modern Web Applications with React and TypeScript",
    summary: "Learn how to create scalable, type-safe applications using the latest features of React 18 and TypeScript 5.",
    category: "Tutorials",
    image: "",
    author: "Bimora Team",
    date: "Jan 15, 2025",
    readingTime: 8,
    views: 15420
  };

  return (
    <LanguageProvider>
      <HeroSection post={heroPost} />
    </LanguageProvider>
  );
}
