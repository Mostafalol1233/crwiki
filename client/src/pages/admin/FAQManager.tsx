import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import TipTapEditor from '@/components/admin/TipTapEditor';

interface FAQ {
  id: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  category: string;
  order_index: number;
  active: boolean;
}

const EMPTY: Partial<FAQ> = { question_en: '', question_ar: '', answer_en: '', answer_ar: '', category: 'General', order_index: 0, active: true };

export default function FAQManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<FAQ>>(EMPTY);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('faq_articles').select('*').order('order_index', { ascending: true });
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!client || !editing.question_en) { toast.error('Question required'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        const { error } = await client.from('faq_articles').update(editing).eq('id', editing.id);
        if (error) throw error; toast.success('Updated');
      } else {
        const maxOrder = Math.max(0, ...items.map((i) => i.order_index || 0));
        const { error } = await client.from('faq_articles').insert({ ...editing, order_index: maxOrder + 1, created_at: new Date().toISOString() });
        if (error) throw error; toast.success('Created');
      }
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete?')) return;
    await client.from('faq_articles').delete().eq('id', id);
    toast.success('Deleted'); await fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    if (!client) return;
    await client.from('faq_articles').update({ active: !active }).eq('id', id);
    await fetch();
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  if (view === 'form') {
    return (
      <div style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit FAQ' : 'New FAQ'}</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Question (EN) *</label><input type="text" value={editing.question_en || ''} onChange={(e) => setEditing({ ...editing, question_en: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Question (AR)</label><input type="text" value={editing.question_ar || ''} onChange={(e) => setEditing({ ...editing, question_ar: e.target.value })} style={{ ...inp, direction: 'rtl' }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
            <div><label style={lbl}>Category</label><input type="text" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Order</label><input type="number" value={editing.order_index || 0} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} style={inp} /></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            <span style={{ fontSize: 13, color: '#a1a1aa' }}>Active</span>
          </label>
          <div><label style={lbl}>Answer (EN)</label><TipTapEditor content={editing.answer_en || ''} onChange={(h) => setEditing({ ...editing, answer_en: h })} placeholder="Answer in English..." minHeight={180} /></div>
          <div><label style={lbl}>Answer (AR)</label><TipTapEditor content={editing.answer_ar || ''} onChange={(h) => setEditing({ ...editing, answer_ar: h })} dir="rtl" placeholder="الإجابة بالعربية..." minHeight={180} /></div>
          <button type="button" onClick={save} disabled={saving} style={{ padding: 10, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>FAQ Manager</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}><Plus size={14} />New FAQ</button>
      </div>

      {loading ? (
        <div style={{ color: '#52525b', textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ color: '#52525b', textAlign: 'center', padding: 40 }}>No FAQs yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <GripVertical size={16} color="#3f3f46" style={{ flexShrink: 0, cursor: 'grab' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: '#fafafa', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.question_en}</div>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>{item.category} · Order: {item.order_index}</div>
              </div>
              <span style={{ fontSize: 12, color: item.active ? '#22c55e' : '#52525b', flexShrink: 0 }}>{item.active ? 'Active' : 'Hidden'}</span>
              <button type="button" onClick={() => toggle(item.id, item.active)} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>
                {item.active ? 'Hide' : 'Show'}
              </button>
              <button type="button" onClick={() => { setEditing(item); setView('form'); }} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', flexShrink: 0 }}><Edit2 size={12} /></button>
              <button type="button" onClick={() => remove(item.id)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
