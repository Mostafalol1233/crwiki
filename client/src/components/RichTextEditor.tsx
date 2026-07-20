import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { Button } from "@/components/ui/button";
import { Code2, Eye } from "lucide-react";

declare global {
  interface Window {
    CodeMirror: any;
  }
}

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  direction?: "ltr" | "rtl";
  height?: number | string;
  resizingBar?: boolean;
};

export function RichTextEditor({ value, onChange, placeholder, direction = "ltr", height = 300, resizingBar = false }: Props) {
  const { toast } = useToast();
  const [cmLoaded, setCmLoaded] = useState(false);
  const [cmModesLoaded, setCmModesLoaded] = useState(false);
  const [rawMode, setRawMode] = useState(false);
  const [rawValue, setRawValue] = useState(value);
  const rawRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.CodeMirror && window.CodeMirror.fromTextArea) {
      setCmLoaded(true);
      setCmModesLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.js";
    script.async = true;
    script.onload = () => {
      if (window.CodeMirror && window.CodeMirror.fromTextArea) {
        setCmLoaded(true);
        const modeXml = document.createElement("script");
        modeXml.src = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/xml/xml.js";
        modeXml.async = true;

        const modeCss = document.createElement("script");
        modeCss.src = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/css/css.js";
        modeCss.async = true;

        const modeJs = document.createElement("script");
        modeJs.src = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/javascript/javascript.js";
        modeJs.async = true;

        const modeHtmlMixed = document.createElement("script");
        modeHtmlMixed.src = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/htmlmixed/htmlmixed.js";
        modeHtmlMixed.async = true;
        modeHtmlMixed.onload = () => setCmModesLoaded(true);

        document.head.appendChild(modeXml);
        document.head.appendChild(modeCss);
        document.head.appendChild(modeJs);
        document.head.appendChild(modeHtmlMixed);
      }
    };
    document.head.appendChild(script);

    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.css";
    document.head.appendChild(style);
  }, []);

  // Sync rawValue when switching to raw mode
  const handleToggleRawMode = useCallback(() => {
    if (!rawMode) {
      // Entering raw mode: sync from current value
      setRawValue(value);
    } else {
      // Leaving raw mode: push raw value to parent
      onChange(rawValue);
    }
    setRawMode(prev => !prev);
  }, [rawMode, value, rawValue, onChange]);

  const handleRawChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawValue(e.target.value);
    onChange(e.target.value);
  }, [onChange]);

  const options = useMemo(() => {
    return {
      buttonList: [
        ["undo", "redo"],
        ["font", "fontSize", "formatBlock"],
        ["paragraphStyle", "blockquote"],
        ["bold", "underline", "italic", "strike", "subscript", "superscript"],
        ["fontColor", "hiliteColor", "textStyle"],
        ["removeFormat"],
        ["outdent", "indent"],
        ["align", "horizontalRule", "list", "lineHeight"],
        ["table", "link", "image", "video", "audio"],
        ["fullScreen", "showBlocks", "codeView"],
        ["preview", "print"],
      ],
      katex: null,
      height: typeof height === 'number' ? `${height}px` : height,
      resizingBar,
      imageRotation: true,
      charCounter: true,
      defaultStyle: `direction:${direction}; text-align:${direction === "rtl" ? "right" : "left"}; font-family: inherit; font-size: 16px;`,
      // Allow all HTML tags including script and style in code view
      pasteTagsBlacklist: '',
      attributeWhitelist: {
        all: 'style|class|id|src|href|alt|title|target|rel|width|height|onclick|onload|data-*',
      },
      codeMirror: cmLoaded && typeof window !== "undefined" && window.CodeMirror ? {
        src: window.CodeMirror,
        options: {
          mode: cmModesLoaded ? "htmlmixed" : "text/html",
          lineNumbers: true,
          lineWrapping: true,
        },
      } : undefined,
    };
  }, [direction, height, cmLoaded, cmModesLoaded, resizingBar]);

  const editorHeightPx = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className="rich-text-editor-container" dir="ltr">
      {/* Toggle between Visual Editor and Raw HTML/JS/CSS editor */}
      <div className="flex justify-end mb-1">
        <Button
          type="button"
          size="sm"
          variant={rawMode ? "default" : "outline"}
          onClick={handleToggleRawMode}
          className="gap-1 text-xs h-7"
        >
          {rawMode ? (
            <><Eye className="w-3 h-3" /> Visual Editor</>
          ) : (
            <><Code2 className="w-3 h-3" /> HTML / JS / CSS</>
          )}
        </Button>
      </div>

      {rawMode ? (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-muted/50 border-b px-3 py-1 flex items-center gap-2">
            <Code2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Raw HTML editor — يقبل HTML و CSS و JavaScript بدون قيود</span>
          </div>
          <textarea
            ref={rawRef}
            value={rawValue}
            onChange={handleRawChange}
            className="w-full font-mono text-xs p-3 bg-zinc-950 text-green-300 resize-y focus:outline-none"
            style={{ minHeight: editorHeightPx, direction: 'ltr' }}
            placeholder="<!-- اكتب HTML أو CSS أو JavaScript هنا -->"
            spellCheck={false}
          />
        </div>
      ) : (
        <SunEditor
          setOptions={options as any}
          setContents={value}
          onChange={(content: string) => onChange(content || "")}
          placeholder={placeholder}
          setDefaultStyle={`direction:${direction}; text-align:${direction === "rtl" ? "right" : "left"};`}
          onImageUploadBefore={async (files: File[], _: any, uploadHandler: any) => {
            try {
              const file = files?.[0];
              if (!file) return;
              const { uploadToSupabase } = await import("@/lib/uploadToSupabase");
              const url = await uploadToSupabase(file, "editor");
              if (!url) throw new Error("No URL returned");

              uploadHandler({ result: [{ url, name: file.name, size: file.size }] });
            } catch (e: any) {
              toast?.({ title: "Upload error", description: e?.message || String(e), variant: "destructive" });
              uploadHandler({ errorMessage: "Upload error" });
            }
          }}
        />
      )}
    </div>
  );
}

export default RichTextEditor;
