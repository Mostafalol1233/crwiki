import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import TipTapEditor from '@/components/admin/TipTapEditor';
import SEOPanel from '@/components/admin/SEOPanel';
import ImageUpload from '@/components/admin/ImageUpload';
import BilingualField from '@/components/admin/BilingualField';
import { useAutoSave } from './hooks/useAutoSave';
import GalleryManager, { GalleryItem } from '@/components/admin/GalleryManager';

interface Post {
  id: string;
  title: string;
  title_ar: string;
  post_slug: string;
  content: string;
  content_ar: string;
  summary: string;
  image_url: string;
  category: string;
  tags: string[];
  author: string;
  featured: boolean;
  language: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  canonical_url: string;
  focus_keyword: string;
  created_at: string;
  gallery: GalleryItem[];
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const EMPTY_POST: Partial<Post> = {
  title: '', title_ar: '', post_slug: '', content: '', content_ar: '',
  summary: '', image_url: '', category: '', tags: [], author: '',
  featured: false, language: 'en', seo_title: '', seo_description: '',
  og_image: '', canonical_url: '', focus_keyword: '', gallery: [],
};

const col = createColumnHelper<Post>();

export default function PostsManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Post>>(EMPTY_POST);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data, error } = await client.from('posts').select('*').order('created_at', { ascending: false });
    if (!error) setPosts(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const { lastSaved } = useAutoSave(`post-${editing.id || 'new'}`, editing, 30000);

  const save = async () => {
    if (!client || !editing.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title:          editing.title || '',
        title_ar:       editing.title_ar || '',
        post_slug:      editing.post_slug || slugify(editing.title || ''),
        content:        editing.content || '',
        content_ar:     editing.content_ar || '',
        summary:        editing.summary || '',
        image_url:      editing.image_url || '',
        category:       editing.category || '',
        tags:           Array.isArray(editing.tags) ? editing.tags : [],
        author:         editing.author || '',
        featured:       editing.featured || false,
        language:       editing.language || 'en',
        seo_title:      editing.seo_title || '',
        seo_description:editing.seo_description || '',
        og_image:       editing.og_image || '',
        canonical_url:  editing.canonical_url || '',
        focus_keyword:  editing.focus_keyword || '',
        gallery:        Array.isArray(editing.gallery) ? editing.gallery : [],
        updated_at:     new Date().toISOString(),
      };

      const doSave = async (p: Record<string, any>) => {
        if (editing.id) {
          const { error } = await client.from('posts').update(p).eq('id', editing.id);
          return error;
        } else {
          const { error } = await client.from('posts').insert({ ...p, created_at: new Date().toISOString() });
          return error;
        }
      };

      // Try full save; if a column is missing, strip it and retry
      let err = await doSave(payload);
      if (err?.code === '42703') {
        // Strip unknown columns one by one based on error message
        const badCol = err.message?.match(/column "([^"]+)"/)?.[1];
        if (badCol && badCol in payload) {
          const stripped = { ...payload };
          delete stripped[badCol];
          err = await doSave(stripped);
          if (!err) toast.warning(`Column "${badCol}" missing — run the SQL setup from Dashboard to enable all features.`);
        }
      }
      if (err) throw err;
      toast.success(editing.id ? 'Post updated' : 'Post created');
      await fetch();
      setView('list');
      setEditing(EMPTY_POST);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete this post?')) return;
    await client.from('posts').delete().eq('id', id);
    toast.success('Deleted');
    await fetch();
  };

  const columns = [
    col.accessor('title', {
      header: 'Title',
      cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue() || '—'}</span>,
    }),
    col.accessor('category', {
      header: 'Category',
      cell: (i) => <span style={{ fontSize: 12, color: '#a1a1aa' }}>{i.getValue() || '—'}</span>,
    }),
    col.accessor('author', {
      header: 'Author',
      cell: (i) => <span style={{ fontSize: 12, color: '#a1a1aa' }}>{i.getValue() || '—'}</span>,
    }),
    col.accessor('featured', {
      header: 'Featured',
      cell: (i) => <span style={{ fontSize: 12, color: i.getValue() ? '#22c55e' : '#52525b' }}>{i.getValue() ? 'Yes' : 'No'}</span>,
    }),
    col.accessor('created_at', {
      header: 'Date',
      cell: (i) => <span style={{ fontSize: 12, color: '#52525b' }}>{i.getValue() ? new Date(i.getValue()).toLocaleDateString() : '—'}</span>,
    }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: (i) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => { setEditing(i.row.original); setView('form'); }}
            style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>
            <Edit2 size={12} />
          </button>
          <button type="button" onClick={() => remove(i.row.original.id)}
            style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
            <Trash2 size={12} />
          </button>
        </div>
      ),
    }),
  ];

  const inputStyle: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  if (view === 'form') {
    return (
      <div style={{ maxWidth: 1200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY_POST); }}
            style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>
            Back
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Post' : 'New Post'}</h1>
          {lastSaved && <span style={{ fontSize: 12, color: '#52525b' }}>Draft saved {lastSaved.toLocaleTimeString()}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'flex-start' }}>
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Title (EN) *</label>
              <input type="text" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value, post_slug: slugify(e.target.value) })} placeholder="Post title..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Title (AR)</label>
              <input type="text" value={editing.title_ar || ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} placeholder="عنوان المقال..." style={{ ...inputStyle, direction: 'rtl' }} />
            </div>
            <div>
              <label style={labelStyle}>Slug</label>
              <input type="text" value={editing.post_slug || ''} onChange={(e) => setEditing({ ...editing, post_slug: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Summary</label>
              <textarea value={editing.summary || ''} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} placeholder="Brief summary..." />
            </div>
            <div>
              <label style={labelStyle}>Content (EN)</label>
              <TipTapEditor content={editing.content || ''} onChange={(html) => setEditing({ ...editing, content: html })} placeholder="Write your post content..." />
            </div>
            <div>
              <label style={labelStyle}>Content (AR)</label>
              <TipTapEditor content={editing.content_ar || ''} onChange={(html) => setEditing({ ...editing, content_ar: html })} placeholder="اكتب محتوى المقال..." dir="rtl" />
            </div>
            {/* Gallery */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <GalleryManager
                value={editing.gallery || []}
                onChange={(items) => setEditing({ ...editing, gallery: items })}
              />
            </div>
          </div>

          {/* Settings panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Publish */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '14px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Publish</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Author</label>
                  <input type="text" value={editing.author || ''} onChange={(e) => setEditing({ ...editing, author: e.target.value })} style={inputStyle} placeholder="Author name" />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <input type="text" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={inputStyle} placeholder="Category" />
                </div>
                <div>
                  <label style={labelStyle}>Tags (comma-separated)</label>
                  <input type="text" value={(editing.tags || []).join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} style={inputStyle} placeholder="tag1, tag2" />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={editing.featured || false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                  <span style={{ fontSize: 13, color: '#a1a1aa' }}>Featured post</span>
                </label>
                <ImageUpload label="Featured Image" value={editing.image_url || ''} onChange={(url) => setEditing({ ...editing, image_url: url })} />
              </div>
            </div>

            {/* SEO */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '14px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>SEO</div>
              <SEOPanel
                seo={{ metaTitle: editing.seo_title || '', metaDescription: editing.seo_description || '', ogImage: editing.og_image || '', canonicalUrl: editing.canonical_url || '', focusKeyword: editing.focus_keyword || '' }}
                onChange={(key, val) => {
                  const map: Record<string, keyof Post> = { metaTitle: 'seo_title', metaDescription: 'seo_description', ogImage: 'og_image', canonicalUrl: 'canonical_url', focusKeyword: 'focus_keyword' };
                  setEditing({ ...editing, [map[key]]: val });
                }}
                content={editing.content || ''}
              />
            </div>

            {/* Actions */}
            <button type="button" onClick={save} disabled={saving}
              style={{ padding: '10px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontSize: 14 }}>
              {saving ? 'Saving...' : editing.id ? 'Update Post' : 'Publish Post'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Posts</h1>
        <button type="button" onClick={() => { setEditing(EMPTY_POST); setView('form'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
          <Plus size={14} />
          New Post
        </button>
      </div>
      <DataTable data={posts} columns={columns} loading={loading} searchPlaceholder="Search posts..." />
    </div>
  );
}
