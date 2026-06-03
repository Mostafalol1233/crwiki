import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import { Send, Lock } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  sender_id: string;
}

const col = createColumnHelper<Ticket>();

const STATUS_COLORS: Record<string, string> = { open: '#3b82f6', 'in_progress': '#f59e0b', resolved: '#22c55e', closed: '#52525b' };
const PRIORITY_COLORS: Record<string, string> = { low: '#52525b', medium: '#f59e0b', high: '#ef4444', urgent: '#a855f7' };

export default function TicketsManager() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  }, [client]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    if (!client) return;
    const { data } = await client.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at');
    setMessages(data || []);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const openTicket = async (ticket: Ticket) => {
    setSelected(ticket);
    await fetchMessages(ticket.id);
    setView('detail');
  };

  const updateStatus = async (ticketId: string, status: string) => {
    if (!client) return;
    await client.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);
    setSelected((prev) => prev ? { ...prev, status } : prev);
    await fetch();
    toast.success('Status updated');
  };

  const sendReply = async () => {
    if (!client || !selected || !reply.trim()) return;
    setSending(true);
    try {
      const { error } = await client.from('ticket_messages').insert({
        ticket_id: selected.id,
        message: reply,
        is_internal: isInternal,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setReply('');
      await fetchMessages(selected.id);
      toast.success(isInternal ? 'Internal note added' : 'Reply sent');
    } catch (e: any) { toast.error(e.message); } finally { setSending(false); }
  };

  const columns = [
    col.accessor('subject', { header: 'Subject', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('priority', { header: 'Priority', cell: (i) => <span style={{ fontSize: 12, color: PRIORITY_COLORS[i.getValue()] || '#a1a1aa', fontWeight: 500, textTransform: 'capitalize' }}>{i.getValue()}</span> }),
    col.accessor('status', { header: 'Status', cell: (i) => <span style={{ fontSize: 12, color: STATUS_COLORS[i.getValue()] || '#a1a1aa', fontWeight: 500, textTransform: 'capitalize' }}>{i.getValue()?.replace(/_/g, ' ')}</span> }),
    col.accessor('created_at', { header: 'Date', cell: (i) => <span style={{ fontSize: 12, color: '#52525b' }}>{i.getValue() ? new Date(i.getValue()).toLocaleDateString() : '—'}</span> }),
    col.display({
      id: 'actions', header: '',
      cell: (i) => (
        <button type="button" onClick={() => openTicket(i.row.original)}
          style={{ padding: '4px 12px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>
          View
        </button>
      ),
    }),
  ];

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 };

  if (view === 'detail' && selected) {
    return (
      <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => { setView('list'); setSelected(null); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0, flex: 1 }}>{selected.subject}</h1>
          <select value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)}
            style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: STATUS_COLORS[selected.status] || '#fafafa', padding: '6px 10px', fontSize: 13, cursor: 'pointer', outline: 'none' }}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Messages thread */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 300, maxHeight: 500, overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ color: '#52525b', fontSize: 13, textAlign: 'center', padding: 40 }}>No messages yet</div>
          ) : messages.map((m) => (
            <div key={m.id} style={{ background: m.is_internal ? 'rgba(212,160,23,0.05)' : '#27272a', border: `1px solid ${m.is_internal ? 'rgba(212,160,23,0.2)' : '#3f3f46'}`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                {m.is_internal && <span style={{ fontSize: 10, color: '#d4a017', background: 'rgba(212,160,23,0.1)', padding: '1px 6px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3 }}><Lock size={9} /> Internal</span>}
                <span style={{ fontSize: 11, color: '#52525b' }}>{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#fafafa', lineHeight: 1.6 }}>{m.message}</p>
            </div>
          ))}
        </div>

        {/* Reply form */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your reply..." rows={3} style={{ ...inp, resize: 'vertical' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#a1a1aa' }}>
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
              Internal note (not visible to user)
            </label>
            <button type="button" onClick={sendReply} disabled={sending || !reply.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              <Send size={13} />{sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Support Tickets</h1>
      <DataTable data={tickets} columns={columns} loading={loading} searchPlaceholder="Search tickets..." />
    </div>
  );
}
