import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <PageSEO
        title={"About — CrossFire Wiki"}
        description={"About CrossFire Wiki — learn who maintains this site and our mission to provide accurate CrossFire game guides and community resources."}
        canonicalPath="/about"
      />
      <div className="min-h-screen py-12 md:py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-20">

        <div className="mb-6">
          <Link href="/">
            <Button
              variant="ghost"
              data-testid="button-back-about"
              className="border border-[#b38322] bg-gradient-to-b from-[#f6cd67] to-[#d8a942] text-[#1f1400] hover:brightness-95"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToHome")}
            </Button>
          </Link>
        </div>

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

          <div className="grid gap-4 md:grid-cols-3 mt-10">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-2">Reliable Updates</h3>
              <p className="text-sm text-muted-foreground">
                We regularly refresh guides, patch details, and gameplay references so players can quickly find current information.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-2">Community-First</h3>
              <p className="text-sm text-muted-foreground">
                CrossFire Wiki is built to help new and veteran players with practical content and clear explanations.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-2">Clear & Fast</h3>
              <p className="text-sm text-muted-foreground">
                We focus on easy navigation, structured pages, and direct answers so you can get what you need faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
