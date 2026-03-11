import { Header } from "../Header";
import { ThemeProvider } from "../ThemeProvider";
import { LanguageProvider } from "../LanguageProvider";

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Header />
      </LanguageProvider>
    </ThemeProvider>
  );
}
