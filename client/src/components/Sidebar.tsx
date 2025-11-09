import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "./LanguageProvider";
import { Link } from "wouter";
import { Eye, Star } from "lucide-react";

interface RecentPost {
  id: string;
  title: string;
  image: string;
  date: string;
}

interface Tag {
  name: string;
  count: number;
}

interface PopularPost {
  id: string;
  title: string;
  views: number;
}

interface SidebarProps {
  recentPosts: RecentPost[];
  popularTags: Tag[];
  mostViewed: PopularPost[];
  bimoraPicks: RecentPost[];
}

export function Sidebar({
  recentPosts,
  popularTags,
  mostViewed,
  bimoraPicks,
}: SidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("recentPosts")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/article/${post.id}`}
              className="flex gap-3 hover-elevate p-2 -m-2 rounded-lg transition-all"
              data-testid={`link-recent-${post.id}`}
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium line-clamp-2 mb-1">
                  {post.title}
                </h4>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("popularTags")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Badge
                key={tag.name}
                variant="secondary"
                className="cursor-pointer hover-elevate"
                data-testid={`badge-popular-tag-${tag.name.toLowerCase()}`}
              >
                {tag.name} ({tag.count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("mostViewed")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mostViewed.map((post, index) => (
            <Link
              key={post.id}
              href={`/article/${post.id}`}
              className="flex items-start gap-3 hover-elevate p-2 -m-2 rounded-lg transition-all"
              data-testid={`link-mostviewed-${post.id}`}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium line-clamp-2 mb-1">
                  {post.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>{(post.views || 0).toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary fill-primary" />
            {t("bimoraPicks")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bimoraPicks.map((post) => (
            <Link
              key={post.id}
              href={`/article/${post.id}`}
              className="flex gap-3 hover-elevate p-2 -m-2 rounded-lg transition-all"
              data-testid={`link-pick-${post.id}`}
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium line-clamp-2 mb-1">
                  {post.title}
                </h4>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
