import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, Mail, Cookie, UserCheck } from "lucide-react";
import PageSEO from "@/components/PageSEO";

export default function Privacy() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const isArabic = lang === "ar";
  const t = (en: string, ar: string) => (isArabic ? ar : en);

  return (
    <>
      <PageSEO
        title={t("Privacy Policy — CrossFire Wiki", "سياسة الخصوصية — CrossFire Wiki")}
        description={t(
          "Learn how CrossFire Wiki collects, uses, and protects your data.",
          "تعرّف على كيفية جمع CrossFire Wiki لبياناتك واستخدامها وحمايتها.",
        )}
        canonicalPath="/privacy"
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
                <Shield className="h-16 w-16 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("Privacy Policy", "سياسة الخصوصية")}</h1>
              <p className="text-lg text-muted-foreground">{t("Last updated: March 26, 2026", "آخر تحديث: 26 مارس 2026")}</p>
            </div>

            <div className="rounded-xl border bg-muted/40 p-5 md:p-6">
              <p className="text-muted-foreground leading-relaxed">
                {t(
                  "Your privacy matters to us. This page explains what data we collect, why we collect it, and the controls you have over your information.",
                  "خصوصيتك مهمة بالنسبة لنا. توضح هذه الصفحة البيانات التي نجمعها، ولماذا نجمعها، وما عناصر التحكم المتاحة لك بشأن معلوماتك.",
                )}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-6 w-6" />
                  {t("Information We Collect", "المعلومات التي نجمعها")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("We collect information you provide directly to us, such as when you:", "نجمع المعلومات التي تقدمها لنا مباشرة، مثل الحالات التالية:")}</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(isArabic
                    ? ["إنشاء حساب أو إرسال تذاكر دعم", "التواصل معنا عبر نظام الدعم", "المشاركة في ميزات المجتمع", "استخدام موقعنا وخدماتنا"]
                    : ["Create an account or submit support tickets", "Contact us through our support system", "Participate in community features", "Use our website and services"]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="h-6 w-6" />
                  {t("How We Use Your Information", "كيفية استخدام معلوماتك")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("We use the information we collect to:", "نستخدم المعلومات التي نجمعها من أجل:")}</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(isArabic
                    ? ["تقديم خدماتنا وصيانتها وتحسينها", "معالجة طلبات الدعم والرد عليها", "إرسال إشعارات تقنية ورسائل دعم", "التواصل معك بشأن المنتجات والخدمات والعروض", "مراقبة أنماط الاستخدام والاتجاهات وتحليلها"]
                    : ["Provide, maintain, and improve our services", "Process and respond to support requests", "Send you technical notices and support messages", "Communicate with you about products, services, and promotions", "Monitor and analyze usage patterns and trends"]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Information Sharing", "مشاركة المعلومات")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information in the following circumstances:",
                    "لا نقوم ببيع معلوماتك الشخصية أو المتاجرة بها أو نقلها إلى أطراف ثالثة دون موافقتك، إلا كما هو موضح في هذه السياسة. وقد نشارك معلوماتك في الحالات التالية:",
                  )}
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  {(isArabic
                    ? ["مع مزودي خدمات يساعدوننا في تشغيل موقعنا", "عند الطلب القانوني أو لحماية حقوقنا", "في حال نقل نشاط تجاري أو الاستحواذ عليه"]
                    : ["With service providers who assist us in operating our website", "When required by law or to protect our rights", "In connection with a business transfer or acquisition"]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Data Security", "أمان البيانات")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.",
                    "نطبق إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. ومع ذلك، لا توجد أي وسيلة نقل عبر الإنترنت آمنة بنسبة 100%.",
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Cookie className="h-6 w-6" />
                  {t("Cookies and Tracking", "ملفات تعريف الارتباط والتتبع")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "We use cookies and similar technologies to enhance your experience on our website. You can control cookie settings through your browser preferences. We may use analytics services to understand how our website is used.",
                    "نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتحسين تجربتك على موقعنا. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال تفضيلات المتصفح. وقد نستخدم خدمات التحليلات لفهم كيفية استخدام موقعنا.",
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Third-Party Services", "خدمات الجهات الخارجية")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.",
                    "قد يحتوي موقعنا على روابط لمواقع أو خدمات تابعة لجهات خارجية. نحن غير مسؤولين عن ممارسات الخصوصية في هذه المواقع الخارجية. ننصحك بمراجعة سياسات الخصوصية الخاصة بها.",
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Children's Privacy", "خصوصية الأطفال")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.",
                    "خدماتنا غير موجهة للأطفال دون سن 13 عامًا. ونحن لا نجمع عن قصد معلومات شخصية من الأطفال دون 13 عامًا. إذا تبين لنا أننا جمعنا مثل هذه المعلومات، فسنتخذ خطوات لحذفها.",
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="h-6 w-6" />
                  {t("Your Rights", "حقوقك")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("Depending on your location, you may have the following rights regarding your personal information:", "بناءً على موقعك الجغرافي، قد تكون لك الحقوق التالية المتعلقة بمعلوماتك الشخصية:")}</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {(isArabic
                    ? ["الوصول إلى معلوماتك الشخصية", "تصحيح المعلومات غير الدقيقة", "حذف معلوماتك الشخصية", "تقييد المعالجة أو الاعتراض عليها", "قابلية نقل البيانات"]
                    : ["Access to your personal information", "Correction of inaccurate information", "Deletion of your personal information", "Restriction or objection to processing", "Data portability"]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Contact Information", "معلومات التواصل")}</h2>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <p className="text-muted-foreground mb-4">{t("If you have any questions about this Privacy Policy, please contact us:", "إذا كان لديك أي استفسار حول سياسة الخصوصية هذه، يرجى التواصل معنا:")}</p>
                  <div className="flex items-center gap-2 text-primary" dir="ltr">
                    <Mail className="h-5 w-5" />
                    <span>contact@crossfire.wiki</span>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("Changes to Privacy Policy", "التغييرات على سياسة الخصوصية")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
                    'قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإشعارك بأي تغييرات عبر نشر النسخة الجديدة من سياسة الخصوصية على هذه الصفحة وتحديث تاريخ "آخر تحديث".',
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
