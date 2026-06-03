import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Edit2, Trash2, KeyRound } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import bcrypt from 'bcryptjs';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

const ROLES = ['super_admin', 'admin', 'editor', 'seller_manager', 'support', 'event_manager', 'news_manager'];
const col = createColumnHelper<AdminUser>();

export default function UsersManager() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('admin_users').select('id, username, email, role, permissions, created_at').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateRole = async () => {
    if (!client || !editingUser || !newRole) return;
    setSaving(true);
    try {
      const { error } = await client.from('admin_users').update({ role: newRole }).eq('id', editingUser.id);
      if (error) throw error;
      toast.success('Role updated');
      setEditingUser(null);
      await fetch();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const resetPassword = async (id: string) => {
    if (!client || !newPassword || newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      const hash = await bcrypt.hash(newPassword, 10);
      const { error } = await client.from('admin_users').update({ password_hash: hash }).eq('id', id);
      if (error) throw error;
      toast.success('Password reset');
      setNewPassword('');
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete this admin user?')) return;
    await client.from('admin_users').delete().eq('id', id);
    toast.success('Deleted'); await fetch();
  };

  const roleColor: Record<string, string> = { super_admin: '#ef4444', admin: '#f59e0b', editor: '#3b82f6', seller_manager: '#22c55e', support: '#a855f7' };

  const columns = [
    col.accessor('username', { header: 'Username', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('email', { header: 'Email', cell: (i) => <span style={{ fontSize: 13, color: '#a1a1aa' }}>{i.getValue() || '—'}</span> }),
    col.accessor('role', { header: 'Role', cell: (i) => <span style={{ fontSize: 12, color: roleColor[i.getValue()] || '#a1a1aa', fontWeight: 500, textTransform: 'capitalize' }}>{(i.getValue() || '').replace(/_/g, ' ')}</span> }),
    col.accessor('created_at', { header: 'Joined', cell: (i) => <span style={{ fontSize: 12, color: '#52525b' }}>{i.getValue() ? new Date(i.getValue()).toLocaleDateString() : '—'}</span> }),
    col.display({
      id: 'actions', header: 'Actions',
      cell: (i) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => { setEditingUser(i.row.original); setNewRole(i.row.original.role); }}
            style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <Edit2 size={12} /> Role
          </button>
          <button type="button" onClick={() => remove(i.row.original.id)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
        </div>
      ),
    }),
  ];

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Admin Users</h1>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search users..." />

      {/* Role edit modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6, padding: 24, width: 400, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fafafa', margin: 0 }}>Edit User: {editingUser.username}</h2>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 6, display: 'block' }}>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 6, display: 'block' }}>Reset Password</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)..." style={{ flex: 1, ...inp }} />
                <button type="button" onClick={() => resetPassword(editingUser.id)} disabled={saving}
                  style={{ padding: '8px 12px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <KeyRound size={12} /> Reset
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={updateRole} disabled={saving} style={{ flex: 1, padding: 10, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{saving ? 'Saving...' : 'Save Role'}</button>
              <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px 16px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
