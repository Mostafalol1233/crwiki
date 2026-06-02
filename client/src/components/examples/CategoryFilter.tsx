import { useState } from "react";
import { CategoryFilter, type Category } from "../CategoryFilter";
import { LanguageProvider } from "../LanguageProvider";

export default function CategoryFilterExample() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  return (
    <LanguageProvider>
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    </LanguageProvider>
  );
}
