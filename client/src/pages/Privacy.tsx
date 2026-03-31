import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, Mail, Cookie, UserCheck } from "lucide-react";
import PageSEO from "@/components/PageSEO";

export default function Privacy() {
  return (
    <>
      <PageSEO
        title={"سياسة الخصوصية — CrossFire Wiki"}
        description={"تعرّف على كيفية جمع CrossFire Wiki لبياناتك واستخدامها وحمايتها."}
        canonicalPath="/privacy"
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
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              سياسة الخصوصية
            </h1>
            <p className="text-lg text-muted-foreground">
              آخر تحديث: 26 مارس 2026
            </p>
          </div>

          <div className="rounded-xl border bg-muted/40 p-5 md:p-6">
            <p className="text-muted-foreground leading-relaxed">
              خصوصيتك مهمة بالنسبة لنا. توضح هذه الصفحة البيانات التي نجمعها، ولماذا نجمعها، وما عناصر التحكم المتاحة لك بشأن معلوماتك.
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6" />
                المعلومات التي نجمعها
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نجمع المعلومات التي تقدمها لنا مباشرة، مثل الحالات التالية:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>إنشاء حساب أو إرسال تذاكر دعم</li>
                <li>التواصل معنا عبر نظام الدعم</li>
                <li>المشاركة في ميزات المجتمع</li>
                <li>استخدام موقعنا وخدماتنا</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6" />
                كيفية استخدام معلوماتك
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نستخدم المعلومات التي نجمعها من أجل:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>تقديم خدماتنا وصيانتها وتحسينها</li>
                <li>معالجة طلبات الدعم والرد عليها</li>
                <li>إرسال إشعارات تقنية ورسائل دعم</li>
                <li>التواصل معك بشأن المنتجات والخدمات والعروض</li>
                <li>مراقبة أنماط الاستخدام والاتجاهات وتحليلها</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">مشاركة المعلومات</h2>
              <p className="text-muted-foreground leading-relaxed">
                لا نقوم ببيع معلوماتك الشخصية أو المتاجرة بها أو نقلها إلى أطراف ثالثة دون موافقتك، إلا كما هو موضح في هذه السياسة. وقد نشارك معلوماتك في الحالات التالية:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                <li>مع مزودي خدمات يساعدوننا في تشغيل موقعنا</li>
                <li>عند الطلب القانوني أو لحماية حقوقنا</li>
                <li>في حال نقل نشاط تجاري أو الاستحواذ عليه</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">أمان البيانات</h2>
              <p className="text-muted-foreground leading-relaxed">
                نطبق إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. ومع ذلك، لا توجد أي وسيلة نقل عبر الإنترنت آمنة بنسبة 100%.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Cookie className="h-6 w-6" />
                ملفات تعريف الارتباط والتتبع
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتحسين تجربتك على موقعنا. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال تفضيلات المتصفح. وقد نستخدم خدمات التحليلات لفهم كيفية استخدام موقعنا.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">خدمات الجهات الخارجية</h2>
              <p className="text-muted-foreground leading-relaxed">
                قد يحتوي موقعنا على روابط لمواقع أو خدمات تابعة لجهات خارجية. نحن غير مسؤولين عن ممارسات الخصوصية في هذه المواقع الخارجية. ننصحك بمراجعة سياسات الخصوصية الخاصة بها.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">خصوصية الأطفال</h2>
              <p className="text-muted-foreground leading-relaxed">
                خدماتنا غير موجهة للأطفال دون سن 13 عامًا. ونحن لا نجمع عن قصد معلومات شخصية من الأطفال دون 13 عامًا. إذا تبين لنا أننا جمعنا مثل هذه المعلومات، فسنتخذ خطوات لحذفها.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="h-6 w-6" />
                حقوقك
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                بناءً على موقعك الجغرافي، قد تكون لك الحقوق التالية المتعلقة بمعلوماتك الشخصية:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>الوصول إلى معلوماتك الشخصية</li>
                <li>تصحيح المعلومات غير الدقيقة</li>
                <li>حذف معلوماتك الشخصية</li>
                <li>تقييد المعالجة أو الاعتراض عليها</li>
                <li>قابلية نقل البيانات</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">معلومات التواصل</h2>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground mb-4">
                  إذا كان لديك أي استفسار حول سياسة الخصوصية هذه، يرجى التواصل معنا:
                </p>
              <div className="flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" />
                <span>contact@crossfire.wiki</span>
              </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">التغييرات على سياسة الخصوصية</h2>
              <p className="text-muted-foreground leading-relaxed">
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإشعارك بأي تغييرات عبر نشر النسخة الجديدة من سياسة الخصوصية على هذه الصفحة وتحديث تاريخ "آخر تحديث".
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
