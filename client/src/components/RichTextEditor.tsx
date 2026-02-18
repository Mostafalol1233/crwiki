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
          const tokRes = await fetch('/api/security/csrf-token', { method: 'GET' });
          const tokJson = await tokRes.json().catch(() => ({}));
          const token = tokJson?.csrfToken || localStorage.getItem('csrfToken') || '';
          const fd = new FormData();
          fd.append('file', file);
          fd.append('folder', 'editor');
          const res = await fetch('/images/upload', {
            method: 'POST',
            headers: token ? { 'X-CSRF-Token': token } as Record<string, string> : undefined,
            body: fd
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || 'Upload failed');
          const url = data?.domainUrl || data?.domain_url || data?.secure_url || '';
          if (!url) throw new Error('No URL returned');
          uploadHandler({ result: [{ url, name: file.name, size: file.size }] });
        } catch (e: any) {
          toast?.({ title: 'Upload error', description: e?.message || String(e), variant: 'destructive' });
          uploadHandler({ errorMessage: 'Upload error' });
        }
      }}
    />
  );
}

export default RichTextEditor;
