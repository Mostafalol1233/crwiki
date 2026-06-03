import { useRef, useState } from "react";
import { Paperclip, X, Loader2 } from "lucide-react";
import { uploadImageToSupabase } from "@/lib/supabaseApi";

interface ImageUploadButtonProps {
  onUpload: (url: string) => void;
  folder?: string;
  bucket?: string;
  label?: string;
  className?: string;
  accept?: string;
}

export function ImageUploadButton({
  onUpload,
  folder = "attachments",
  bucket = "uploads",
  label = "Attach Image",
  className = "",
  accept = "image/*",
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFile = async (file: File) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadImageToSupabase(file, bucket, folder);
      setPreview(url);
      onUpload(url);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border transition-all disabled:opacity-50"
          style={{
            background: "hsl(var(--muted))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          {uploading ? (
            <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
          ) : (
            <Paperclip size={14} strokeWidth={1.5} />
          )}
          {uploading ? "Uploading…" : label}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => { setPreview(""); onUpload(""); }}
            className="inline-flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={12} strokeWidth={1.5} /> Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {preview && (
        <img
          src={preview}
          alt="Uploaded attachment"
          className="rounded border object-cover"
          style={{ maxHeight: 120, maxWidth: 220 }}
        />
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
