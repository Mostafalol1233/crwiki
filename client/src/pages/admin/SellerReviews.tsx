import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';

interface Review {
  id: string;
  seller_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

const col = createColumnHelper<Review>();

export default function SellerReviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('seller_reviews').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggle = async (id: string, approved: boolean) => {
    if (!client) return;
    await client.from('seller_reviews').update({ approved: !approved }).eq('id', id);
    toast.success(approved ? 'Hidden' : 'Approved');
    await fetch();
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete review?')) return;
    await client.from('seller_reviews').delete().eq('id', id);
    toast.success('Deleted'); await fetch();
  };

  const stars = (n: number) => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)));

  const columns = [
    col.accessor('reviewer_name', { header: 'Reviewer', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue() || 'Anonymous'}</span> }),
    col.accessor('rating', { header: 'Rating', cell: (i) => <span style={{ color: '#d4a017', fontSize: 13, letterSpacing: 1 }}>{stars(i.getValue())}</span> }),
    col.accessor('comment', { header: 'Comment', cell: (i) => <span style={{ fontSize: 13, color: '#a1a1aa', maxWidth: 300, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.getValue()}</span> }),
    col.accessor('approved', { header: 'Status', cell: (i) => <span style={{ fontSize: 12, color: i.getValue() ? '#22c55e' : '#f59e0b', fontWeight: 500 }}>{i.getValue() ? 'Approved' : 'Pending'}</span> }),
    col.accessor('created_at', { header: 'Date', cell: (i) => <span style={{ fontSize: 12, color: '#52525b' }}>{i.getValue() ? new Date(i.getValue()).toLocaleDateString() : '—'}</span> }),
    col.display({
      id: 'actions', header: 'Actions',
      cell: (i) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => toggle(i.row.original.id, i.row.original.approved)}
            style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: i.row.original.approved ? '#f59e0b' : '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            {i.row.original.approved ? <EyeOff size={12} /> : <Eye size={12} />}
            {i.row.original.approved ? 'Hide' : 'Approve'}
          </button>
          <button type="button" onClick={() => remove(i.row.original.id)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
        </div>
      ),
    }),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Seller Reviews</h1>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search reviews..." />
    </div>
  );
}
