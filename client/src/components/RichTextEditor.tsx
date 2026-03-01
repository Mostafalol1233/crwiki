import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
};

export function RichTextEditor({ value, onChange, placeholder, direction = "ltr", height = 300 }: Props) {
  const [Editor, setEditor] = useState<any>(null);
  const { toast } = useToast();
  const [cmLoaded, setCmLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.CodeMirror && window.CodeMirror.fromTextArea) {
      setCmLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.js";
    script.async = true;
    script.onload = () => {
      if (window.CodeMirror && window.CodeMirror.fromTextArea) {
        setCmLoaded(true);
      }
    };
    document.head.appendChild(script);

    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.css";
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await import("suneditor/dist/css/suneditor.min.css");
        const mod = await import("suneditor-react");
        if (mounted) setEditor(() => mod.default);
      } catch {
        setEditor(() => null);
      }
    })();
    return () => {
      mounted = false;
    };
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
      height,
      resizingBar: true,
      imageRotation: true,
      charCounter: true,
      defaultStyle: `direction:${direction}; text-align:${direction === "rtl" ? "right" : "left"};`,
      codeMirror: cmLoaded && typeof window !== "undefined" && window.CodeMirror ? window.CodeMirror : undefined,
    };
  }, [direction, height, cmLoaded]);

  if (!Editor) {
    return (
      <textarea
        dir={direction}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", height: typeof height === "number" ? `${height}px` : String(height) }}
        className="border rounded-md p-2"
      />
    );
  }

  return (
    <Editor
      setOptions={options as any}
      defaultValue={value}
      onChange={(content: string) => onChange(content || "")}
      placeholder={placeholder}
      setDefaultStyle={`direction:${direction}; text-align:${direction === "rtl" ? "right" : "left"};`}
      onImageUploadBefore={async (files: File[], _: any, uploadHandler: any) => {
        try {
          const file = files?.[0];
          if (!file) return;
          let csrfToken = localStorage.getItem("csrfToken") || "";
          try {
            const tokRes = await fetch("/api/security/csrf-token", { method: "GET", credentials: "include" });
            const tokJson = await tokRes.json().catch(() => ({}));
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

          const res = await fetch("/images/upload", {
            method: "POST",
            headers: Object.keys(headers).length ? headers : undefined,
            body: fd,
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data?.ok === false) {
            throw new Error(data?.error || "Upload failed");
          }
          const url =
            data?.domainUrl ||
            data?.domain_url ||
            data?.cloudinaryUrl ||
            data?.cloudinary_url ||
            data?.secure_url ||
            data?.url ||
            "";
          if (!url) throw new Error("No URL returned");

          uploadHandler({ result: [{ url, name: file.name, size: file.size }] });
        } catch (e: any) {
          toast?.({ title: "Upload error", description: e?.message || String(e), variant: "destructive" });
          uploadHandler({ errorMessage: "Upload error" });
        }
      }}
    />
  );
}

export default RichTextEditor;
