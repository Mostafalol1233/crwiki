import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, Users, Mail, Gavel, AlertTriangle } from "lucide-react";
import PageSEO from "@/components/PageSEO";

export default function Terms() {
  return (
    <>
      <PageSEO
        title={"شروط الخدمة — CrossFire Wiki"}
        description={"اقرأ شروط خدمة CrossFire Wiki وإرشادات الاستخدام."}
        canonicalPath="/terms"
      />
      <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              العودة إلى الرئيسية
            </Button>
          </Link>
        </div>

        <div className="space-y-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <FileText className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              شروط الخدمة
            </h1>
            <p className="text-lg text-muted-foreground">
              آخر تحديث: 26 مارس 2026
            </p>
          </div>

          <div className="rounded-xl border bg-muted/40 p-5 md:p-6">
            <p className="text-muted-foreground leading-relaxed">
              توضح هذه الشروط حقوقك ومسؤولياتك عند استخدام CrossFire Wiki. من خلال الاستمرار في التصفح أو التسجيل أو إرسال المحتوى، فإنك توافق على الالتزام بهذه السياسة.
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6" />
                قبول الشروط
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                من خلال الوصول إلى CrossFire Wiki (crossfire.wiki) واستخدامه، فإنك تقبل وتوافق على الالتزام بشروط وأحكام هذه الاتفاقية. إذا لم توافق على ما سبق، يُرجى عدم استخدام هذه الخدمة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6" />
                مسؤوليات المستخدم
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>تقديم معلومات صحيحة ودقيقة عند إنشاء الحسابات أو إرسال المحتوى</li>
                <li>احترام حقوق الملكية الفكرية للآخرين</li>
                <li>عدم الانخراط في المضايقة أو الرسائل المزعجة أو السلوك المسيء</li>
                <li>الالتزام بشروط خدمة CrossFire وإرشادات المجتمع</li>
                <li>عدم محاولة تجاوز إجراءات الأمان أو الوصول إلى مناطق محظورة</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Gavel className="h-6 w-6" />
                إرشادات المحتوى
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                يجب أن يلتزم جميع المحتوى على CrossFire Wiki بالإرشادات التالية:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>يجب أن يكون المحتوى متعلقًا بلعبة CrossFire</li>
                <li>يُمنع خطاب الكراهية أو التمييز أو المحتوى المسيء</li>
                <li>احترام سياسات حقوق النشر والاستخدام العادل</li>
                <li>تقديم معلومات دقيقة قدر الإمكان</li>
                <li>ذكر المصادر عند الاقتضاء</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">الملكية الفكرية</h2>
              <p className="text-muted-foreground leading-relaxed">
                محتوى CrossFire Wiki محمي بموجب قوانين حقوق النشر والعلامات التجارية. علامة CrossFire® التجارية مسجلة باسم Smilegate. جميع المحتويات والصور والمواد المتعلقة باللعبة تعود إلى مالكيها الأصليين. يقدم CrossFire Wiki محتوى معلوماتيًا لأغراض تعليمية فقط.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                إخلاء المسؤولية
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                المعلومات المقدمة على CrossFire Wiki هي لأغراض معلوماتية عامة فقط. ورغم سعينا للدقة، لا يمكننا ضمان اكتمال المعلومات أو حداثتها. استخدامك لهذا الموقع يكون على مسؤوليتك الخاصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">معلومات التواصل</h2>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground mb-4">
                  إذا كان لديك أي استفسار حول شروط الخدمة هذه، يرجى التواصل معنا:
                </p>
                <div className="flex items-center gap-2 text-primary">
                  <Mail className="h-5 w-5" />
                  <span>contact@crossfire.wiki</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">التغييرات على الشروط</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحتفظ بالحق في تعديل هذه الشروط في أي وقت. تصبح التغييرات سارية فور نشرها على هذه الصفحة. استمرارك في استخدام الخدمة يعني قبولك للشروط المعدلة.
              </p>
            </section>
          </div>

          <div className="text-center pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              © 2026 CrossFire Wiki من Bimora Gaming. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
