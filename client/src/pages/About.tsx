import { useLanguage } from "@/components/LanguageProvider";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          {t("aboutBimora")}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("aboutWelcome")}
          </p>

          <h2 className="text-2xl md:text-3xl font-semibold mt-12 mb-4">
            {t("ourMission")}
          </h2>
          <p className="leading-relaxed">
            {t("missionText")}
          </p>

          <h2 className="text-2xl md:text-3xl font-semibold mt-12 mb-4">
            {t("whatWeCover")}
          </h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t("coverItem1")}</li>
            <li>{t("coverItem2")}</li>
            <li>{t("coverItem3")}</li>
            <li>{t("coverItem4")}</li>
            <li>{t("coverItem5")}</li>
          </ul>

          <h2 className="text-2xl md:text-3xl font-semibold mt-12 mb-4">
            {t("joinCommunity")}
          </h2>
          <p className="leading-relaxed">
            {t("communityText")}
          </p>
        </div>
      </div>
    </div>
  );
}
