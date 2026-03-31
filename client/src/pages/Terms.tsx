import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, Users, Mail, Gavel, AlertTriangle } from "lucide-react";
import PageSEO from "@/components/PageSEO";

export default function Terms() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const isArabic = lang === "ar";
  const t = (en: string, ar: string) => (isArabic ? ar : en);

  return (
    <>
      <PageSEO
        title={t("Terms of Service — CrossFire Wiki", "شروط الخدمة — CrossFire Wiki")}
        description={t("Read the CrossFire Wiki terms of service and usage guidelines.", "اقرأ شروط خدمة CrossFire Wiki وإرشادات الاستخدام.")}
        canonicalPath="/terms"
      />
      <div className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="mb-6 flex items-center justify-between gap-2">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("Back to Home", "العودة إلى الرئيسية")}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant={lang === "en" ? "default" : "outline"} size="sm" onClick={() => setLang("en")}>EN</Button>
              <Button variant={lang === "ar" ? "default" : "outline"} size="sm" onClick={() => setLang("ar")}>AR</Button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <FileText className="h-16 w-16 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("Terms of Service", "شروط الخدمة")}</h1>
              <p className="text-lg text-muted-foreground">{t("Last updated: March 26, 2026", "آخر تحديث: 26 مارس 2026")}</p>
            </div>

            <div className="rounded-xl border bg-muted/40 p-5 md:p-6">
              <p className="text-muted-foreground leading-relaxed">
                {t(
                  "These terms explain your rights and responsibilities when using CrossFire Wiki. By continuing to browse, register, or submit content, you agree to follow this policy.",
                  "توضح هذه الشروط حقوقك ومسؤولياتك عند استخدام CrossFire Wiki. من خلال الاستمرار في التصفح أو التسجيل أو إرسال المحتوى، فإنك توافق على الالتزام بهذه السياسة.",
                )}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  {t("Acceptance of Terms", "قبول الشروط")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "By accessing and using CrossFire Wiki (crossfire.wiki), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
                    "من خلال الوصول إلى CrossFire Wiki (crossfire.wiki) واستخدامه، فإنك تقبل وتوافق على الالتزام بشروط وأحكام هذه الاتفاقية. إذا لم توافق على ما سبق، يُرجى عدم استخدام هذه الخدمة.",
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  {t("User Responsibilities", "مسؤوليات المستخدم")}
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(isArabic
                    ? ["تقديم معلومات صحيحة ودقيقة عند إنشاء الحسابات أو إرسال المحتوى", "احترام حقوق الملكية الفكرية للآخرين", "عدم الانخراط في المضايقة أو الرسائل المزعجة أو السلوك المسيء", "الالتزام بشروط خدمة CrossFire وإرشادات المجتمع", "عدم محاولة تجاوز إجراءات الأمان أو الوصول إلى مناطق محظورة"]
                    : ["Provide accurate and truthful information when creating accounts or submitting content", "Respect intellectual property rights of others", "Not engage in harassment, spam, or abusive behavior", "Follow CrossFire's terms of service and community guidelines", "Not attempt to circumvent security measures or access restricted areas"]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Gavel className="h-6 w-6" />
                  {t("Content Guidelines", "إرشادات المحتوى")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("All content on CrossFire Wiki must adhere to the following guidelines:", "يجب أن يلتزم جميع المحتوى على CrossFire Wiki بالإرشادات التالية:")}</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(isArabic
                    ? ["يجب أن يكون المحتوى متعلقًا بلعبة CrossFire", "يُمنع خطاب الكراهية أو التمييز أو المحتوى المسيء", "احترام سياسات حقوق النشر والاستخدام العادل", "تقديم معلومات دقيقة قدر الإمكان", "ذكر المصادر عند الاقتضاء"]
                    : ["Content must be relevant to CrossFire gaming", "No hate speech, discrimination, or offensive material", "Respect copyright and fair use policies", "Provide accurate information to the best of your ability", "Credit sources when applicable"]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Intellectual Property", "الملكية الفكرية")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "CrossFire Wiki content is protected by copyright and trademark laws. CrossFire® is a registered trademark of Smilegate. All game-related content, images, and materials belong to their respective owners. CrossFire Wiki provides informational content for educational purposes only.",
                    "محتوى CrossFire Wiki محمي بموجب قوانين حقوق النشر والعلامات التجارية. علامة CrossFire® التجارية مسجلة باسم Smilegate. جميع المحتويات والصور والمواد المتعلقة باللعبة تعود إلى مالكيها الأصليين. يقدم CrossFire Wiki محتوى معلوماتيًا لأغراض تعليمية فقط.",
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  {t("Disclaimer", "إخلاء المسؤولية")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "The information provided on CrossFire Wiki is for general informational purposes only. While we strive for accuracy, we cannot guarantee the completeness or timeliness of information. Use of this website is at your own risk.",
                    "المعلومات المقدمة على CrossFire Wiki هي لأغراض معلوماتية عامة فقط. ورغم سعينا للدقة، لا يمكننا ضمان اكتمال المعلومات أو حداثتها. استخدامك لهذا الموقع يكون على مسؤوليتك الخاصة.",
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Contact Information", "معلومات التواصل")}</h2>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <p className="text-muted-foreground mb-4">{t("If you have any questions about these Terms of Service, please contact us:", "إذا كان لديك أي استفسار حول شروط الخدمة هذه، يرجى التواصل معنا:")}</p>
                  <div className="flex items-center gap-2 text-primary" dir="ltr">
                    <Mail className="h-5 w-5" />
                    <span>contact@crossfire.wiki</span>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Changes to Terms", "التغييرات على الشروط")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this page. Your continued use of the service constitutes acceptance of the modified terms.",
                    "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. تصبح التغييرات سارية فور نشرها على هذه الصفحة. استمرارك في استخدام الخدمة يعني قبولك للشروط المعدلة.",
                  )}
                </p>
              </section>
            </div>

            <div className="text-center pt-8 border-t">
              <p className="text-sm text-muted-foreground">{t("© 2026 CrossFire Wiki by Bimora Gaming. All rights reserved.", "© 2026 CrossFire Wiki من Bimora Gaming. جميع الحقوق محفوظة.")}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
