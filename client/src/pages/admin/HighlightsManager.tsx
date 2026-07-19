import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Upload, Image as ImageIcon, Video, Save, X } from 'lucide-react';
import { supabaseService } from '@/lib/supabaseAdmin';
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

const S = {
  page: { padding: 24 } as React.CSSProperties,
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 } as React.CSSProperties,
  title: { fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 } as React.CSSProperties,
  btn: (variant: 'primary' | 'danger' | 'ghost' = 'ghost'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    background: variant === 'primary' ? '#d4a017' : variant === 'danger' ? 'rgba(239,68,68,0.12)' : '#27272a',
    color: variant === 'primary' ? '#09090b' : variant === 'danger' ? '#ef4444' : '#a1a1aa',
  }),
  card: {
    background: '#18181b', border: '1px solid #27272a', borderRadius: 8,
    marginBottom: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center',
  } as React.CSSProperties,
  input: {
    background: '#27272a', border: '1px solid #3f3f46', borderRadius: 5,
    color: '#fafafa', padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%',
  } as React.CSSProperties,
  label: { fontSize: 11, color: '#71717a', marginBottom: 4, display: 'block' } as React.CSSProperties,
  thumb: { width: 72, height: 52, borderRadius: 4, objectFit: 'cover' as const, background: '#27272a', border: '1px solid #3f3f46', flexShrink: 0 },
  emptyThumb: { width: 72, height: 52, borderRadius: 4, background: '#27272a', border: '1px solid #3f3f46', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
};

async function fetchHighlights(): Promise<Highlight[]> {
  const { data, error } = await supabase
    .from('site_highlights')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

const adminClient = () => supabaseService || supabase;

async function upsertHighlight(h: Partial<Highlight>): Promise<void> {
  const { error } = await adminClient()
    .from('site_highlights')
    .upsert(h, { onConflict: 'id' });
  if (error) throw error;
}

async function deleteHighlight(id: string): Promise<void> {
  const { error } = await adminClient()
    .from('site_highlights')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function NewHighlightForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', month: 'Jan', year: CURRENT_YEAR, media_type: 'image' as 'image' | 'video', url: '' });
  const [uploading, setUploading] = useState(false);

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
      toast.success('File uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: () => upsertHighlight({ ...form, sort_order: Date.now() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['highlights'] }); toast.success('Added'); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#fafafa' }}>New Highlight</span>
        <button type="button" onClick={onDone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b' }}><X size={16} /></button>
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
          <input style={S.input} type="number" value={form.year} onChange={e => set('year', Number(e.target.value))} min={2020} max={2030} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['image', 'video'] as const).map(t => (
            <button key={t} type="button" onClick={() => set('media_type', t)} style={{
              ...S.btn(form.media_type === t ? 'primary' : 'ghost'),
              padding: '5px 12px',
            }}>
              {t === 'image' ? <ImageIcon size={13} /> : <Video size={13} />}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>URL or Upload</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...S.input, flex: 1 }} value={form.url} onChange={e => set('url', e.target.value)} placeholder={form.media_type === 'video' ? 'Video URL (Supabase, Catbox, etc)...' : 'Image URL...'} />
          <button type="button" onClick={() => fileRef.current?.click()} style={S.btn('ghost')} disabled={uploading}>
            <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <input ref={fileRef} type="file" hidden accept={form.media_type === 'video' ? 'video/*' : 'image/*'} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={onDone} style={S.btn('ghost')}>Cancel</button>
        <button type="button" onClick={() => save.mutate()} style={S.btn('primary')} disabled={!form.title || !form.url || save.isPending}>
          <Save size={13} /> {save.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function HighlightsManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: highlights = [], isLoading } = useQuery<Highlight[]>({
    queryKey: ['highlights'],
    queryFn: fetchHighlights,
  });

  const deleteMut = useMutation({
    mutationFn: deleteHighlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['highlights'] }); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Highlights</h1>
        <button type="button" onClick={() => setShowForm(true)} style={S.btn('primary')}>
          <Plus size={14} /> Add Highlight
        </button>
      </div>

      <p style={{ fontSize: 13, color: '#52525b', marginBottom: 20, marginTop: -12 }}>
        Manage the homepage highlights carousel. Supports images and local video files.
      </p>

      {showForm && <NewHighlightForm onDone={() => setShowForm(false)} />}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#52525b', fontSize: 14 }}>Loading...</div>
      )}

      {!isLoading && highlights.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: 60, color: '#3f3f46', border: '1px dashed #27272a', borderRadius: 8 }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>No highlights yet</div>
          <div style={{ fontSize: 12 }}>Add your first highlight above</div>
        </div>
      )}

      {highlights.map((h) => (
        <div key={h.id} style={S.card}>
          <div style={{ color: '#3f3f46', cursor: 'grab', flexShrink: 0 }}>
            <GripVertical size={16} />
          </div>

          {h.media_type === 'video' ? (
            <div style={{ ...S.emptyThumb }}>
              <Video size={20} style={{ color: '#52525b' }} />
            </div>
          ) : (
            <img src={h.url} alt={h.title} style={S.thumb} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#fafafa', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {h.title}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#71717a' }}>{h.month} {h.year}</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: h.media_type === 'video' ? 'rgba(96,165,250,0.1)' : 'rgba(74,222,128,0.1)', color: h.media_type === 'video' ? '#60a5fa' : '#4ade80' }}>
                {h.media_type}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#3f3f46', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {h.url}
            </div>
          </div>

          <button
            type="button"
            onClick={() => deleteMut.mutate(h.id)}
            style={{ ...S.btn('danger'), padding: '6px 10px', flexShrink: 0 }}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
