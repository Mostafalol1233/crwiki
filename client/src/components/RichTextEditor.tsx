import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";

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

  return (
    <div className="rich-text-editor-container" dir="ltr">
      <SunEditor
        setOptions={options as any}
        setContents={value}
      onChange={(content: string) => onChange(content || "")}
      placeholder={placeholder}
      setDefaultStyle={`direction:${direction}; text-align:${direction === "rtl" ? "right" : "left"};`}
      onImageUploadBefore={async (files: File[], _info: any, uploadHandler: any) => {
        try {
          const file = files[0];
          if (!file) return;

          // Get CSRF token
          let csrfToken = localStorage.getItem("csrfToken") || "";
          try {
            const tokRes = await fetch("/api/security/csrf-token");
            const tokJson = await tokRes.json();
            if (tokJson?.csrfToken) {
              csrfToken = tokJson.csrfToken;
              localStorage.setItem("csrfToken", csrfToken);
            }
          } catch { }

          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "editor");

          const headers: Record<string, string> = {};
          if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

          // Use the unified upload endpoint
          const res = await fetch("/images/upload", {
            method: "POST",
            headers,
            body: fd,
          });

          const data = await res.json();
          if (!res.ok || !data.ok) {
            throw new Error(data.error || "Upload failed");
          }

          // Prefer domainUrl (proxy) or secure_url (direct Cloudinary)
          const url = data.domainUrl || data.domain_url || data.secure_url || data.url;
          
          if (!url) throw new Error("No URL returned from server");

          // Return the response in the format SunEditor expects
          const response = {
            result: [
              {
                url: url,
                name: file.name,
                size: file.size
              }
            ]
          };
          
          uploadHandler(response);
          return undefined; // Important: return undefined to prevent default upload behavior
        } catch (e: any) {
          console.error("Editor upload error:", e);
          toast({ 
            title: "Upload Failed", 
            description: e.message || "Could not upload image", 
            variant: "destructive" 
          });
          uploadHandler(e.toString());
          return undefined;
        }
      }}
    />
    </div>
  );
}

export default RichTextEditor;
