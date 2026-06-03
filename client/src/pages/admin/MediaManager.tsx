import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Copy, Trash2, Grid, List, Check } from 'lucide-react';

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata?: { size?: number; mimetype?: string };
  publicUrl: string;
}

const BUCKET = 'media';

function formatSize(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function MediaManager() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list('', { sortBy: { column: 'created_at', order: 'desc' }, limit: 200 });
      if (error) throw error;
      const withUrls: MediaFile[] = (data || []).filter((f) => f.name !== '.emptyFolderPlaceholder').map((f) => ({
        ...f,
        publicUrl: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
      }));
      setFiles(withUrls);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const upload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(fileList)) {
      const filename = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
      const { error } = await supabase.storage.from(BUCKET).upload(filename, file, { contentType: file.type, upsert: false });
      if (!error) ok++;
    }
    toast.success(`Uploaded ${ok} file${ok > 1 ? 's' : ''}`);
    setUploading(false);
    await fetch();
  };

  const remove = async (names: string[]) => {
    if (!confirm(`Delete ${names.length} file${names.length > 1 ? 's' : ''}?`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove(names);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    setSelected(new Set());
    await fetch();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
    toast.success('URL copied');
  };

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const isImage = (f: MediaFile) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Media Library</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {selected.size > 0 && (
            <button type="button" onClick={() => remove(Array.from(selected))}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid #ef4444', borderRadius: 4, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
              <Trash2 size={13} />Delete {selected.size}
            </button>
          )}
          <button type="button" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{ padding: '7px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
            <Upload size={13} />{uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{ border: `1px dashed ${dragOver ? '#d4a017' : '#27272a'}`, borderRadius: 6, padding: 20, textAlign: 'center', background: dragOver ? 'rgba(212,160,23,0.05)' : 'transparent', color: '#52525b', fontSize: 13, transition: 'border-color 0.15s' }}
      >
        Drop files here to upload, or use the Upload button above
      </div>

      {/* Grid/List */}
      {loading ? (
        <div style={{ color: '#52525b', fontSize: 14, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : files.length === 0 ? (
        <div style={{ color: '#52525b', fontSize: 14, padding: 40, textAlign: 'center' }}>No files uploaded yet</div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {files.map((f) => (
            <div key={f.name} onClick={() => toggleSelect(f.name)}
              style={{ position: 'relative', background: '#18181b', border: `1px solid ${selected.has(f.name) ? '#d4a017' : '#27272a'}`, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}>
              {isImage(f) ? (
                <img src={f.publicUrl} alt={f.name} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: 100, background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#52525b' }}>
                  {f.name.split('.').pop()?.toUpperCase()}
                </div>
              )}
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: 11, color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>{formatSize(f.metadata?.size)}</div>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); copyUrl(f.publicUrl); }}
                style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, background: '#09090b', border: '1px solid #3f3f46', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: copied === f.publicUrl ? '#22c55e' : '#a1a1aa' }}>
                {copied === f.publicUrl ? <Check size={11} /> : <Copy size={11} />}
              </button>
              {selected.has(f.name) && (
                <div style={{ position: 'absolute', top: 6, left: 6, width: 16, height: 16, background: '#d4a017', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={10} color="#09090b" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, overflow: 'hidden' }}>
          {files.map((f, i) => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < files.length - 1 ? '1px solid #1f1f22' : 'none', background: selected.has(f.name) ? 'rgba(212,160,23,0.05)' : 'transparent', cursor: 'pointer' }}
              onClick={() => toggleSelect(f.name)}>
              {isImage(f) ? <img src={f.publicUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, background: '#27272a', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#52525b', flexShrink: 0 }}>{f.name.split('.').pop()?.toUpperCase()}</div>}
              <span style={{ flex: 1, fontSize: 13, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <span style={{ fontSize: 12, color: '#52525b', flexShrink: 0 }}>{formatSize(f.metadata?.size)}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); copyUrl(f.publicUrl); }}
                style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: copied === f.publicUrl ? '#22c55e' : '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, flexShrink: 0 }}>
                {copied === f.publicUrl ? <Check size={11} /> : <Copy size={11} />} Copy URL
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); remove([f.name]); }}
                style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" multiple accept="image/*,video/*,audio/*" onChange={(e) => upload(e.target.files)} style={{ display: 'none' }} />
    </div>
  );
}
