import { useState, useRef, useCallback } from 'react';
import { uploadToSupabase } from '@/lib/uploadToSupabase';
import { Upload, X, Link2, Search } from 'lucide-react';
import ContentImage from '@/components/ContentImage';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
  accept?: string;
  hint?: string;
  searchQuery?: string; // optional override for search term
}

function slugifyFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ImageUpload({ value, onChange, label = 'Image', bucket = 'media', accept = 'image/*', hint, searchQuery }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const url = await uploadToSupabase(file, bucket);
      onChange(url);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [bucket, onChange]);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#a1a1aa' }}>{label}</label>}

      {value ? (
        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
          <ContentImage
            src={value}
            alt="Preview"
            onError={() => setError('This URL did not return a usable image. Use a direct image URL or upload a file.')}
            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6, border: '1px solid #3f3f46', display: 'block' }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 6, right: 6, width: 24, height: 24,
              background: '#09090b', border: '1px solid #3f3f46', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#a1a1aa',
            }}
          >
            <X size={13} />
          </button>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{ padding: '4px 10px', fontSize: 12, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer' }}
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1px dashed ${dragOver ? '#d4a017' : '#3f3f46'}`,
            borderRadius: 6,
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            cursor: uploading ? 'wait' : 'pointer',
            background: dragOver ? 'rgba(212,160,23,0.05)' : '#18181b',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          {uploading ? (
            <div style={{ color: '#a1a1aa', fontSize: 13 }}>Uploading...</div>
          ) : (
            <>
              <Upload size={20} color="#52525b" />
              <span style={{ fontSize: 13, color: '#52525b', textAlign: 'center' }}>
                Drop image here or click to upload
              </span>
              {hint && <span style={{ fontSize: 12, color: '#3f3f46' }}>{hint}</span>}
            </>
          )}
        </div>
      )}

      {/* URL Input — always visible */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, padding: '0 10px', overflow: 'hidden' }}>
          <Link2 size={12} color="#52525b" style={{ flexShrink: 0 }} />
          <input
            type="url"
            placeholder="Paste image URL…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && urlInput) { onChange(urlInput); setUrlInput(''); } }}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fafafa', padding: '6px 4px', fontSize: 13, outline: 'none', minWidth: 0 }}
          />
        </div>
        {urlInput && (
          <button
            type="button"
            onClick={() => { onChange(urlInput); setUrlInput(''); }}
            style={{ padding: '6px 12px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Use
          </button>
        )}
        <button
          type="button"
          title={`Search Google Images for "${searchQuery || label}"`}
          onClick={() => {
            const q = encodeURIComponent((searchQuery || label) + ' crossfire game');
            window.open(`https://www.google.com/search?tbm=isch&q=${q}`, '_blank');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: 12, background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#52525b', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <Search size={12} /> Search
        </button>
      </div>

      {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: 'none' }}
      />
    </div>
  );
}
