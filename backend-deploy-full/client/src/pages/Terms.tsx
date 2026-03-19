import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, Users, Mail } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { format } from "date-fns";
import PageSEO from "@/components/PageSEO";

export default function Terms() {
  const { t } = useLanguage();

  return (
    <>
      <PageSEO
        title={"Terms of Service — CrossFire Wiki"}
        description={"Read the CrossFire Wiki terms of service and usage guidelines."}
        canonicalPath="/terms"
      />
      <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="space-y-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <FileText className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {format(new Date(), "MMM d, yyyy")}
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using CrossFire Wiki (crossfire.wiki), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6" />
                User Responsibilities
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide accurate and truthful information when creating accounts or submitting content</li>
                <li>Respect intellectual property rights of others</li>
                <li>Not engage in harassment, spam, or abusive behavior</li>
                <li>Follow CrossFire's terms of service and community guidelines</li>
                <li>Not attempt to circumvent security measures or access restricted areas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Content Guidelines</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All content on CrossFire Wiki must adhere to the following guidelines:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Content must be relevant to CrossFire gaming</li>
                <li>No hate speech, discrimination, or offensive material</li>
                <li>Respect copyright and fair use policies</li>
                <li>Provide accurate information to the best of your ability</li>
                <li>Credit sources when applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                CrossFire Wiki content is protected by copyright and trademark laws. CrossFire® is a registered trademark of Smilegate. All game-related content, images, and materials belong to their respective owners. CrossFire Wiki provides informational content for educational purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                The information provided on CrossFire Wiki is for general informational purposes only. While we strive for accuracy, we cannot guarantee the completeness or timeliness of information. Use of this website is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="flex items-center gap-2 text-primary">
                  <Mail className="h-5 w-5" />
                  <span>contact@crossfire.wiki</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this page. Your continued use of the service constitutes acceptance of the modified terms.
              </p>
            </section>
          </div>

          <div className="text-center pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              © 2024 CrossFire Wiki by Bimora Gaming. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
