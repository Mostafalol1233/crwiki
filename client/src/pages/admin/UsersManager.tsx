import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Edit2, Trash2, KeyRound, Plus, X } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import { adminFetch } from '@/lib/supabaseAdmin';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

type AdminDraft = {
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: Record<string, boolean>;
};

const ADMIN_ENDPOINT = '/api/admin/rebuild?action=admin-table&type=admin_users';
const ROLES = ['super_admin', 'admin', 'editor', 'seller_manager', 'support', 'event_manager', 'news_manager'];
const SCOPES = [
  ['content:manage', 'Content'],
  ['sellers:manage', 'Sellers'],
  ['highlights:manage', 'Highlights'],
  ['weapons:manage', 'Weapons'],
  ['competition:manage', 'Competition'],
  ['read_only', 'Read only'],
] as const;
const col = createColumnHelper<AdminUser>();

const emptyDraft = (): AdminDraft => ({
  username: '',
  email: '',
  password: '',
  role: 'admin',
  permissions: {},
});

export default function UsersManager() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<AdminDraft>(emptyDraft());
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminFetch<{ data?: AdminUser[] }>(ADMIN_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ operation: 'list', page: 1, pageSize: 100 }),
      });
      setItems(response.data || []);
    } catch (error: any) {
      toast.error(error?.message || 'Unable to load administrators');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const updateRoleAndPermissions = async () => {
    if (!editingUser || !draft.role) return;
    setSaving(true);
    try {
      await adminFetch(ADMIN_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          operation: 'update',
          id: editingUser.id,
          row: { role: draft.role, permissions: draft.permissions, email: draft.email },
        }),
      });
      toast.success('Administrator access updated');
      setEditingUser(null);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Unable to update administrator');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!editingUser || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await adminFetch(ADMIN_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ operation: 'update', id: editingUser.id, row: { password: newPassword } }),
      });
      toast.success('Password reset');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to reset password');
    } finally {
      setSaving(false);
    }
  };

  const createAdmin = async () => {
    if (draft.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (draft.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await adminFetch(ADMIN_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ operation: 'create', row: draft }),
      });
      toast.success('Administrator created');
      setCreating(false);
      setDraft(emptyDraft());
      await fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Unable to create administrator');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this administrator?')) return;
    try {
      await adminFetch(ADMIN_ENDPOINT, { method: 'POST', body: JSON.stringify({ operation: 'delete', id }) });
      toast.success('Administrator deleted');
      await fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Unable to delete administrator');
    }
  };

  const roleColor: Record<string, string> = {
    super_admin: '#e5e7eb',
    admin: '#cbd5e1',
    editor: '#94a3b8',
    seller_manager: '#aeb8c4',
    support: '#aeb8c4',
  };

  const columns = [
    col.accessor('username', { header: 'Username', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('email', { header: 'Email', cell: (i) => <span style={{ fontSize: 13, color: '#a1a1aa' }}>{i.getValue() || '—'}</span> }),
    col.accessor('role', { header: 'Role', cell: (i) => <span style={{ fontSize: 12, color: roleColor[i.getValue()] || '#a1a1aa', fontWeight: 500, textTransform: 'capitalize' }}>{(i.getValue() || '').replace(/_/g, ' ')}</span> }),
    col.accessor('created_at', { header: 'Joined', cell: (i) => <span style={{ fontSize: 12, color: '#71717a' }}>{i.getValue() ? new Date(i.getValue()).toLocaleDateString() : '—'}</span> }),
    col.display({
      id: 'actions', header: 'Actions',
      cell: (i) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => {
            const user = i.row.original;
            setEditingUser(user);
            setDraft({ username: user.username, email: user.email || '', password: '', role: user.role, permissions: user.permissions || {} });
            setNewPassword('');
          }} style={buttonStyle}>
            <Edit2 size={12} /> Access
          </button>
          <button type="button" onClick={() => void remove(i.row.original.id)} style={{ ...buttonStyle, color: '#ef4444' }}><Trash2 size={12} /></button>
        </div>
      ),
    }),
  ];

  const inputStyle: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const modalStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };

  const Form = ({ mode }: { mode: 'create' | 'edit' }) => (
    <div style={modalStyle}>
      <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, padding: 24, width: 460, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#fafafa', margin: 0 }}>{mode === 'create' ? 'Create administrator' : `Edit access: ${editingUser?.username}`}</h2>
          <button type="button" onClick={() => { setCreating(false); setEditingUser(null); }} style={{ background: 'transparent', border: 0, color: '#a1a1aa', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {mode === 'create' && <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} placeholder="Username" style={inputStyle} />}
        <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email (optional)" style={inputStyle} />
        {mode === 'create' && <input type="password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="Password (minimum 8 characters)" style={inputStyle} />}
        <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
          {ROLES.map((role) => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SCOPES.map(([key, label]) => (
            <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#d4d4d8', fontSize: 13 }}>
              <input type="checkbox" checked={Boolean(draft.permissions[key])} onChange={(e) => setDraft({ ...draft, permissions: { ...draft.permissions, [key]: e.target.checked } })} />
              {label}
            </label>
          ))}
        </div>
        {mode === 'edit' && <div style={{ display: 'flex', gap: 8 }}><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" style={{ ...inputStyle, flex: 1 }} /><button type="button" onClick={() => void resetPassword()} disabled={saving} style={buttonStyle}><KeyRound size={12} /> Reset</button></div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={() => void (mode === 'create' ? createAdmin() : updateRoleAndPermissions())} disabled={saving} style={{ flex: 1, padding: 10, background: '#aeb8c4', border: 'none', borderRadius: 4, color: '#0b0f14', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{saving ? 'Saving...' : mode === 'create' ? 'Create administrator' : 'Save access'}</button>
          <button type="button" onClick={() => { setCreating(false); setEditingUser(null); }} style={{ padding: '10px 16px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div><h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Admin Users</h1><p style={{ color: '#71717a', fontSize: 13, margin: '6px 0 0' }}>Manage administrators and their server-enforced access scopes.</p></div>
        <button type="button" onClick={() => { setDraft(emptyDraft()); setCreating(true); }} style={{ ...buttonStyle, padding: '8px 12px', background: '#aeb8c4', color: '#0b0f14', borderColor: '#aeb8c4' }}><Plus size={14} /> Create administrator</button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search administrators..." />
      {creating && <Form mode="create" />}
      {editingUser && <Form mode="edit" />}
    </div>
  );
}

const buttonStyle: React.CSSProperties = { padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 };
