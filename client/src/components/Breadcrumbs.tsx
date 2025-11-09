import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems = [
    { name: "Home", url: "/" },
    ...items,
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      {allItems.map((item, index) => (
        <div key={item.url} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
          {index === allItems.length - 1 ? (
            <span className="text-foreground font-medium">{item.name}</span>
          ) : (
            <Link
              href={item.url}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {index === 0 && <Home className="h-3 w-3" />}
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

