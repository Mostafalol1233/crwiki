import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Upload, Image as ImageIcon, Video, Save, X, Pencil, Download } from 'lucide-react';
import { adminFetch } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

interface Highlight {
  id: string;
  title: string;
  month: string;
  year: number;
  media_type: 'image' | 'video';
  url: string;
  sort_order: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();

// Same static highlights shown on the homepage — used as fallback/seed
const STATIC_HIGHLIGHTS: Omit<Highlight, 'id'>[] = [
  { month: 'Jun', year: 2026, media_type: 'image', url: 'https://z8games.akamaized.net/cfna/web/main/Forum/260528_cfwe_zppu_bonus_forums.jpg',   title: 'Summer Breeze Bonus — June 2026',                           sort_order: 1 },
  { month: 'Apr', year: 2026, media_type: 'image', url: 'https://z8games.akamaized.net/cfna/web/main/Forum/260330_cfwe_bp_apr_main_forum.jpg',     title: 'Mercenary Pass Season 59: Rising Tide — April 2026',        sort_order: 2 },
  { month: 'Mar', year: 2026, media_type: 'image', url: 'https://z8games.akamaized.net/cfna/web/main/Forum/260223_cfwe_zppubonus_forums.jpg',      title: 'March Of Gold — March 2026',                               sort_order: 3 },
  { month: 'Jan', year: 2026, media_type: 'image', url: 'https://z8games.akamaized.net/cfna/web/main/Forum/251223_cfwe_bp_jan2026_main_forum.jpg', title: 'Mercenary Pass Season 58: Timeless Treasures — January 2026', sort_order: 4 },
  { month: 'Dec', year: 2025, media_type: 'image', url: 'https://z8games.akamaized.net/cfna/web/main/Forum/251126_cfwe_npu_forum.jpg',             title: 'Sleighbell Bonus — December 2025',                          sort_order: 5 },
  { month: 'Nov', year: 2025, media_type: 'image', url: 'https://z8games.akamaized.net/cfna/web/main/Forum/251027_cfwe_zppubonus_forums.jpg',      title: 'Wavelite Bonus Surge — November 2025',                      sort_order: 6 },
];

const S = {
  page: { padding: 24 } as React.CSSProperties,
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 } as React.CSSProperties,
  title: { fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 } as React.CSSProperties,
  btn: (variant: 'primary' | 'danger' | 'ghost' | 'secondary' = 'ghost'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    background: variant === 'primary' ? '#d4a017'
              : variant === 'danger'    ? 'rgba(239,68,68,0.12)'
              : variant === 'secondary' ? 'rgba(58,123,213,0.15)'
              : '#27272a',
    color: variant === 'primary'   ? '#09090b'
         : variant === 'danger'    ? '#ef4444'
         : variant === 'secondary' ? '#60a5fa'
         : '#a1a1aa',
  }),
  card: {
    background: '#18181b', border: '1px solid #27272a', borderRadius: 8,
    marginBottom: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
  } as React.CSSProperties,
  input: {
    background: '#27272a', border: '1px solid #3f3f46', borderRadius: 5,
    color: '#fafafa', padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%',
  } as React.CSSProperties,
  label: { fontSize: 11, color: '#71717a', marginBottom: 4, display: 'block' } as React.CSSProperties,
};

const ADMIN_TABLE_ENDPOINT = '/api/admin/rebuild?action=admin-table&type=highlights';
const adminClient = () => supabase;

async function fetchHighlights(): Promise<Highlight[]> {
  const response = await adminFetch<{ data?: any[] }>(ADMIN_TABLE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ operation: 'list', page: 1, pageSize: 100 }),
  });
  return (response.data || []).map((h: any) => ({
    ...h,
    id: String(h.id),
    month: String(h.month || 'Jan'),
    year: Number(h.year) || CURRENT_YEAR,
    sort_order: Number(h.sort_order) || 0,
  }));
}

async function upsertHighlight(h: Partial<Highlight>): Promise<void> {
  const id = String(h.id || '').trim();
  await adminFetch(ADMIN_TABLE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      operation: id ? 'update' : 'create',
      ...(id ? { id } : {}),
      row: { ...h, ...(id ? {} : { sort_order: h.sort_order || Date.now() }) },
    }),
  });
}

async function deleteHighlight(id: string): Promise<void> {
  await adminFetch(ADMIN_TABLE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ operation: 'delete', id }),
  });
}

async function importStatic(): Promise<void> {
  await Promise.all(STATIC_HIGHLIGHTS.map((row) => adminFetch(ADMIN_TABLE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ operation: 'create', row }),
  })));
}

// ─── Form ────────────────────────────────────────────────────────────────────
function HighlightForm({
  initial, onDone, label,
}: {
  initial: { title: string; month: string; year: number; media_type: 'image' | 'video'; url: string; id?: string };
  onDone: () => void;
  label: string;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ ...initial });
  const [uploading, setUploading] = useState(false);
  const [previewOk, setPreviewOk] = useState(true);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `highlights/${Date.now()}.${ext}`;
      const { error } = await adminClient().storage.from('media').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = adminClient().storage.from('media').getPublicUrl(path);
      set('url', data.publicUrl);
      setPreviewOk(true);
      toast.success('File uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: () => upsertHighlight({
      ...form,
      sort_order: form.id ? undefined as any : Date.now(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['highlights'] });
      toast.success(form.id ? 'Updated' : 'Added');
      onDone();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#fafafa' }}>{label}</span>
        <button type="button" onClick={onDone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={S.label}>Title</label>
          <input style={S.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event name..." />
        </div>
        <div>
          <label style={S.label}>Month</label>
          <select style={S.input} value={form.month} onChange={e => set('month', e.target.value)}>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Year</label>
          <input style={S.input} type="number" value={form.year} onChange={e => set('year', Number(e.target.value))} min={2020} max={2035} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['image', 'video'] as const).map(t => (
            <button key={t} type="button" onClick={() => set('media_type', t)} style={{
              ...S.btn(form.media_type === t ? 'primary' : 'ghost'), padding: '5px 12px',
            }}>
              {t === 'image' ? <ImageIcon size={13} /> : <Video size={13} />} {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>URL or Upload</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            value={form.url}
            onChange={e => { set('url', e.target.value); setPreviewOk(true); }}
            placeholder={form.media_type === 'video' ? 'Video URL...' : 'Image URL...'}
          />
          <button type="button" onClick={() => fileRef.current?.click()} style={S.btn('ghost')} disabled={uploading}>
            <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        <input ref={fileRef} type="file" hidden accept={form.media_type === 'video' ? 'video/*' : 'image/*'}
          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
      </div>

      {form.url && form.media_type === 'image' && (
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Preview</label>
          <div style={{ width: '100%', aspectRatio: '16/7', background: '#050810', borderRadius: 6, border: '1px solid #3f3f46', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {previewOk
              ? <img src={form.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setPreviewOk(false)} />
              : <span style={{ color: '#52525b', fontSize: 12 }}>Image failed to load</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={onDone} style={S.btn('ghost')}>Cancel</button>
        <button type="button" onClick={() => save.mutate()} style={S.btn('primary')} disabled={!form.title || !form.url || save.isPending}>
          <Save size={13} /> {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Row card ─────────────────────────────────────────────────────────────────
function HighlightCard({
  h, onEdit, onDelete, deleting,
}: {
  h: Highlight; onEdit: () => void; onDelete: () => void; deleting: boolean;
}) {
  return (
    <div style={S.card}>
      <div style={{ color: '#3f3f46', cursor: 'grab', flexShrink: 0, marginTop: 2 }}>
        <GripVertical size={16} />
      </div>

      {h.media_type === 'video' ? (
        <div style={{ width: 72, height: 52, borderRadius: 4, background: '#27272a', border: '1px solid #3f3f46', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Video size={20} style={{ color: '#52525b' }} />
        </div>
      ) : (
        <div style={{ width: 72, height: 52, background: '#050810', borderRadius: 4, border: '1px solid #3f3f46', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={h.url} alt={h.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#fafafa', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {h.title}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#71717a' }}>{h.month} {h.year}</span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 3,
            background: h.media_type === 'video' ? 'rgba(96,165,250,0.1)' : 'rgba(74,222,128,0.1)',
            color: h.media_type === 'video' ? '#60a5fa' : '#4ade80',
          }}>
            {h.media_type}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#3f3f46', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {h.url}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button type="button" onClick={onEdit} style={{ ...S.btn('ghost'), padding: '6px 10px' }} title="Edit">
          <Pencil size={14} />
        </button>
        <button type="button" onClick={onDelete} style={{ ...S.btn('danger'), padding: '6px 10px' }} disabled={deleting} title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HighlightsManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: highlights = [], isLoading, error } = useQuery<Highlight[]>({
    queryKey: ['highlights'],
    queryFn: fetchHighlights,
    retry: 1,
  });

  const deleteMut = useMutation({
    mutationFn: deleteHighlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['highlights'] }); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: importStatic,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['highlights'] }); toast.success('Default highlights imported!'); },
    onError: (e: any) => toast.error('Import failed: ' + e.message),
  });

  const isEmpty = !isLoading && highlights.length === 0 && !error;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Highlights</h1>
          <p style={{ fontSize: 13, color: '#52525b', margin: '4px 0 0' }}>
            Manage the homepage highlights carousel — images and videos.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isEmpty && (
            <button
              type="button"
              onClick={() => importMut.mutate()}
              style={S.btn('secondary')}
              disabled={importMut.isPending}
              title="Import the 6 static highlights currently shown on the homepage"
            >
              <Download size={14} />
              {importMut.isPending ? 'Importing…' : 'Import Defaults'}
            </button>
          )}
          <button type="button" onClick={() => { setShowForm(true); setEditId(null); }} style={S.btn('primary')}>
            <Plus size={14} /> Add Highlight
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && !editId && (
        <HighlightForm
          label="New Highlight"
          initial={{ title: '', month: 'Jan', year: CURRENT_YEAR, media_type: 'image', url: '' }}
          onDone={() => setShowForm(false)}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#52525b', fontSize: 14 }}>Loading…</div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
          Could not load highlights: {(error as any).message}. Make sure the <code>site_highlights</code> table exists in Supabase (run the full setup SQL).
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !showForm && (
        <div style={{ textAlign: 'center', padding: 60, color: '#3f3f46', border: '1px dashed #27272a', borderRadius: 8 }}>
          <div style={{ fontSize: 14, marginBottom: 6, color: '#71717a' }}>No highlights in the database yet</div>
          <div style={{ fontSize: 12, marginBottom: 20 }}>
            The homepage is currently showing 6 built-in static highlights.
          </div>
          <button
            type="button"
            onClick={() => importMut.mutate()}
            style={S.btn('secondary')}
            disabled={importMut.isPending}
          >
            <Download size={14} />
            {importMut.isPending ? 'Importing…' : 'Import those 6 defaults so you can edit them'}
          </button>
        </div>
      )}

      {/* List */}
      {highlights.map((h) => (
        <div key={h.id}>
          {editId === h.id && (
            <HighlightForm
              label={`Edit: ${h.title}`}
              initial={{ id: h.id, title: h.title, month: h.month, year: h.year, media_type: h.media_type, url: h.url }}
              onDone={() => setEditId(null)}
            />
          )}
          {editId !== h.id && (
            <HighlightCard
              h={h}
              onEdit={() => { setEditId(h.id); setShowForm(false); }}
              onDelete={() => deleteMut.mutate(h.id)}
              deleting={deleteMut.isPending}
            />
          )}
        </div>
      ))}
    </div>
  );
}
