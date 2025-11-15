# CrossFire West - Style Export

هذا الملف يحتوي على كل ملفات التصميم والستايل من موقع CrossFire West.

## الملفات المضمنة:

### ملفات التصميم الأساسية:
- tailwind.config.ts - إعدادات Tailwind والألوان والـ animations
- postcss.config.js - إعدادات PostCSS
- components.json - إعدادات shadcn/ui
- client/src/index.css - الـ CSS variables والـ utility classes

### Utility Files:
- client/src/lib/utils.ts - الـ cn() function

### UI Components:
- client/src/components/ui/ - كل الـ UI components (Button, Card, Badge, etc.)

### Components الرئيسية:
- Header.tsx - الهيدر
- Footer.tsx - الفوتر
- HeroCarousel.tsx - الـ carousel الرئيسي
- FeaturedNews.tsx - عرض الأخبار
- MercenaryGallery.tsx - عرض الشخصيات
- CategoryPreview.tsx - عرض الفئات

## كيفية الاستخدام:

1. انسخ ملفات التصميم الأساسية للمشروع الجديد
2. انسخ مجلد ui/ كامل
3. انسخ الـ components اللي محتاجها
4. تأكد إن عندك نفس الـ dependencies في package.json:
   - tailwindcss
   - @tailwindcss/typography
   - tailwindcss-animate
   - class-variance-authority
   - clsx
   - tailwind-merge
   - framer-motion
   - @radix-ui packages

## التأثيرات المتضمنة:

- تكبير الصور عند الوقوف عليها: `group-hover:scale-110`
- Backdrop blur effects
- Fade-in و slide-in animations
- Elevate effects من index.css
- Gradient overlays

تم التصدير بتاريخ: ١٤‏/١١‏/٢٠٢٥، ٥:٠٧:٠٥ م
