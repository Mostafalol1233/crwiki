import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "./LanguageProvider";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useLanguage();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={t("search")}
        value={value}
        onChange={(e) => {
          console.log(`Search query: ${e.target.value}`);
          onChange(e.target.value);
        }}
        className="pl-10"
        data-testid="input-search"
      />
    </div>
  );
}
