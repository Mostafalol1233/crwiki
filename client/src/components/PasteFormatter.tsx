import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Copy, Wand2 } from "lucide-react";

interface PasteFormatterProps {
  isOpen: boolean;
  onClose: () => void;
  pastedText: string;
  onFormatted: (formattedHtml: string) => void;
}

export function PasteFormatter({
  isOpen,
  onClose,
  pastedText,
  onFormatted,
}: PasteFormatterProps) {
  const [editorContent, setEditorContent] = useState(pastedText);
  const [selectedTab, setSelectedTab] = useState("preview");

  // Strip inline styles from HTML
  const stripInlineStyles = (html: string): string => {
    // Create a temporary div to parse HTML
    const parser = new DOMParser();
    try {
      const doc = parser.parseFromString(html, "text/html");
      
      // Remove all style attributes from all elements
      const allElements = doc.querySelectorAll("*");
      allElements.forEach((el) => {
        el.removeAttribute("style");
        el.removeAttribute("class");
        // Preserve basic formatting tags only
        if (!["P", "STRONG", "B", "EM", "I", "U", "BR", "DIV", "SPAN", "H1", "H2", "H3"].includes(el.tagName)) {
          // For other tags, keep content but replace tag with paragraph
          const parent = el.parentNode;
          if (parent) {
            const textContent = el.textContent || "";
            if (textContent.trim()) {
              parent.replaceChild(doc.createTextNode(textContent), el);
            }
          }
        }
      });
      
      let result = doc.body.innerHTML;
      // Clean up empty tags and normalize
      result = result
        .replace(/<p[^>]*>/g, "<p>") // Normalize p tags
        .replace(/<strong[^>]*>/g, "<strong>") // Normalize strong tags
        .replace(/<em[^>]*>/g, "<em>") // Normalize em tags
        .replace(/<u[^>]*>/g, "<u>") // Normalize u tags
        .replace(/<span[^>]*>/g, "") // Remove spans
        .replace(/<\/span>/g, "") // Remove span closers
        .replace(/<div>/g, "<p>") // Convert divs to paragraphs
        .replace(/<\/div>/g, "</p>")
        .replace(/<br\s*\/?>/gi, "") // Remove br tags
        .replace(/<p>\s*<\/p>/g, "") // Remove empty paragraphs
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();
      
      return result;
    } catch (e) {
      // Fallback to regex if DOMParser fails
      console.warn("DOMParser failed, using regex fallback", e);
      return html
        .replace(/\s*style="[^"]*"/gi, "")
        .replace(/\s*class="[^"]*"/gi, "")
        .replace(/<(?!\/?(p|strong|b|em|i|u|br|div|span)\b)[^>]*>/gi, "")
        .replace(/<span[^>]*>/gi, "")
        .replace(/<\/span>/gi, "")
        .trim();
    }
  };

  const handleKeepAsIs = () => {
    // Convert plain text to HTML with line breaks preserved
    const html = pastedText
      .split("\n")
      .map((line) => (line.trim() ? `<p>${line}</p>` : ""))
      .join("");
    onFormatted(stripInlineStyles(html));
    handleClose();
  };

  const handleUseEditor = () => {
    onFormatted(stripInlineStyles(editorContent));
    handleClose();
  };

  const handleClose = () => {
    setEditorContent(pastedText);
    setSelectedTab("preview");
    onClose();
  };

  // Auto-detect formatting in pasted text
  const hasFormatting =
    pastedText.includes("**") ||
    pastedText.includes("__") ||
    pastedText.includes("*") ||
    pastedText.includes("_");

  // Convert markdown-like formatting to HTML
  const autoFormatText = () => {
    let formatted = pastedText;

    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Italic: *text* or _text_
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");

    // Links: [text](url)
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Headings: # text
    formatted = formatted.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    formatted = formatted.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    formatted = formatted.replace(/^### (.*?)$/gm, "<h3>$1</h3>");

    // Line breaks
    formatted = formatted
      .split("\n")
      .map((line) => {
        if (!line.trim()) return "";
        if (
          line.startsWith("<") ||
          line.startsWith("•") ||
          line.startsWith("-")
        ) {
          // Already formatted or is a list item
          return line.includes("<") ? line : `<p>• ${line.replace(/^[•-]\s*/, "")}</p>`;
        }
        return line.includes("<") ? line : `<p>${line}</p>`;
      })
      .join("");

    setEditorContent(stripInlineStyles(formatted));
    setSelectedTab("editor");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Format Pasted Content
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="editor">Rich Editor</TabsTrigger>
            <TabsTrigger value="raw">Raw Text</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[400px] overflow-y-auto">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: pastedText }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={autoFormatText}
                variant="outline"
                className="flex-1"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Auto Format
              </Button>
              <Button
                onClick={handleKeepAsIs}
                variant="default"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Keep As Is
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={editorContent}
                onChange={setEditorContent}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "blockquote", "code-block"],
                    ["clean"],
                  ],
                }}
                style={{ minHeight: "300px" }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Design your content in the editor above. Use the toolbar for formatting.
            </p>
          </TabsContent>

          <TabsContent value="raw" className="space-y-4">
            <textarea
              value={pastedText}
              onChange={(e) => setEditorContent(e.target.value)}
              className="w-full h-[300px] p-3 border rounded-lg font-mono text-sm resize-none"
              placeholder="Raw pasted text..."
            />
            <p className="text-xs text-gray-500">
              View and edit the raw pasted text. Changes here won't affect other tabs.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUseEditor} className="gap-2">
            <Check className="h-4 w-4" />
            Use Formatted Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Icon import fix
function Check({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
