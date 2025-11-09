import { Button } from "@/components/ui/button";
import { useLanguage } from "./LanguageProvider";
import { Link } from "wouter";

export type Category = "all" | "news" | "reviews" | "tutorials" | "events";

interface CategoryFilterProps {
  activeCategory: Category;
  onCategoryChange?: (category: Category) => void;
  useNavigation?: boolean;
}

export function CategoryFilter({
  activeCategory,
  onCategoryChange,
  useNavigation = false,
}: CategoryFilterProps) {
  const { t } = useLanguage();

  const categories: Category[] = [
    "all",
    "news",
    "tutorials",
    "events",
  ];

  if (useNavigation) {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((category) => (
          <Link key={category} href={
            category === "all" ? "/" : 
            category === "events" ? "/events" :
            category === "tutorials" ? "/tutorials" :
            `/category/${category}`
          }>
            <Button
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              data-testid={`button-category-${category}`}
            >
              {t(category)}
            </Button>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={activeCategory === category ? "default" : "outline"}
          size="sm"
          onClick={() => {
            console.log(`Category changed to: ${category}`);
            onCategoryChange?.(category);
          }}
          className="whitespace-nowrap"
          data-testid={`button-category-${category}`}
        >
          {t(category)}
        </Button>
      ))}
    </div>
  );
}
