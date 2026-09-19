import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import { adminFetch } from '@/lib/supabaseAdmin';
import { Trash2 } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

const col = createColumnHelper<Subscriber>();

export default function NewsletterManager() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminFetch<{ data?: Subscriber[] }>('/api/admin/rebuild', {
        method: 'POST',
        body: JSON.stringify({ action: 'admin-table', type: 'newsletter_subscribers', operation: 'list', page: 1, pageSize: 100 }),
      });
      setItems(Array.isArray(result.data) ? result.data : []);
    } catch (e: any) {
      toast.error(e?.message || 'Unable to load subscribers');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPage(); }, [fetchPage]);

  const remove = async (id: string) => {
    if (!confirm('Delete this subscriber?')) return;
    try {
      await adminFetch('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'admin-table', type: 'newsletter_subscribers', operation: 'delete', id }) });
      toast.success('Deleted');
      await fetchPage();
    } catch (e: any) {
      toast.error(e?.message || 'Unable to delete');
    }
  };

  const columns = [
    col.accessor('email', { header: 'Email', cell: (i) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{i.getValue()}</span> }),
    col.accessor('created_at', { header: 'Subscribed', cell: (i) => new Date(i.getValue() as string).toLocaleDateString() }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <button type="button" onClick={() => void remove(info.row.original.id)} style={{ padding: '4px 8px', background: '#7f1d1d', border: 'none', borderRadius: 4, color: '#fecaca', cursor: 'pointer' }}>
          <Trash2 size={12} />
        </button>
      ),
    }),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Newsletter</h1>
        <p style={{ fontSize: 12, color: '#71717a', margin: '5px 0 0' }}>{items.length} subscribers — from footer "ابقَ على اطلاع"</p>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Filter emails..." pageSize={50} />
    </div>
  );
}
