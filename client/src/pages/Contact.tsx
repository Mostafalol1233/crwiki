import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function Contact() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    console.log("Contact form submitted:", { name, email, message });
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("contactUs")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("contactSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <Mail className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">{t("email")}</h3>
              <p className="text-sm text-muted-foreground">
                contact@bimora.blog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">{t("chat")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("liveChatSupport")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Send className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">{t("social")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("followUsOnline")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("sendUsMessage")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t("name")}</label>
              <Input
                placeholder={t("yourName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-contact-name"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("email")}</label>
              <Input
                type="email"
                placeholder={t("yourEmail")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-contact-email"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("message")}</label>
              <Textarea
                placeholder={t("tellUsWhatsOnYourMind")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                data-testid="input-contact-message"
              />
            </div>

            <Button onClick={handleSubmit} className="w-full" data-testid="button-contact-submit">
              {t("submit")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
