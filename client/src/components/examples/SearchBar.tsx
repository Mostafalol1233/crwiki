import { useState } from "react";
import { SearchBar } from "../SearchBar";
import { LanguageProvider } from "../LanguageProvider";

export default function SearchBarExample() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <LanguageProvider>
      <SearchBar value={searchValue} onChange={setSearchValue} />
    </LanguageProvider>
  );
}
