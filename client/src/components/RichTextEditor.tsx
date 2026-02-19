import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
        ["formatBlock", "bold", "underline", "italic", "strike"],
        ["fontColor", "hiliteColor"],
        ["align", "list", "indent", "outdent"],
        ["table", "link", "image", "video"],
        ["removeFormat", "fullScreen", "showBlocks", "codeView"],
      ],
      katex: null,
      height,
      resizingBar: true,
      imageRotation: true,
      charCounter: true,
      defaultStyle: `direction:${direction}; text-align:${direction === "rtl" ? "right" : "left"};`,
    };
  }, [direction, height]);

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
          const tokRes = await fetch("/api/security/csrf-token", { method: "GET", credentials: "include" });
          const tokJson = await tokRes.json().catch(() => ({}));
          const csrfToken = tokJson?.csrfToken || localStorage.getItem("csrfToken") || "";
          const adminToken = localStorage.getItem("adminToken") || localStorage.getItem("userToken") || "";
          const baseHeaders: Record<string, string> = {};
          if (csrfToken) baseHeaders["X-CSRF-Token"] = csrfToken;
          if (adminToken) baseHeaders["Authorization"] = `Bearer ${adminToken}`;

          const uploadViaCloudinary = async () => {
            const fd = new FormData();
            fd.append("images", file);
            const res = await fetch("/api/upload-image", {
              method: "POST",
              headers: baseHeaders,
              body: fd,
              credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok || !Array.isArray(data.results) || !data.results[0]?.ok) {
              const firstErr = Array.isArray(data?.results) && data.results[0] && data.results[0].error;
              throw new Error(data?.error || firstErr || "Upload failed");
            }
            const item = data.results[0];
            const url = item.fullUrl || item.url;
            if (!url) throw new Error("No URL returned");
            return url as string;
          };

          const uploadLocally = async () => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", "editor");
            const headers = csrfToken ? { "X-CSRF-Token": csrfToken } as Record<string, string> : undefined;
            const res = await fetch("/images/upload", {
              method: "POST",
              headers,
              body: fd,
              credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Upload failed");
            const url = data?.domainUrl || data?.domain_url || data?.cloudinaryUrl || data?.secure_url || "";
            if (!url) throw new Error("No URL returned");
            return url as string;
          };

          let finalUrl = "";
          try {
            finalUrl = await uploadViaCloudinary();
          } catch {
            finalUrl = await uploadLocally();
          }

          uploadHandler({ result: [{ url: finalUrl, name: file.name, size: file.size }] });
        } catch (e: any) {
          toast?.({ title: "Upload error", description: e?.message || String(e), variant: "destructive" });
          uploadHandler({ errorMessage: "Upload error" });
        }
      }}
    />
  );
}

export default RichTextEditor;
