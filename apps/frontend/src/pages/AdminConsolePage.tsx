import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export function AdminConsolePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('STUDENT');
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        fetch('/api/v1/admin/stats', { credentials: 'include' }),
        fetch('/api/v1/admin/users?page=1&limit=50', { credentials: 'include' }),
        fetch('/api/v1/admin/audit-logs?page=1&limit=50', { credentials: 'include' }),
      ]);
      if (statsRes.ok) setAdminStats(await statsRes.json());
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setAdminUsers(uData.items || []);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setAdminLogs(lData.items || []);
      }
    } catch {}
  }, [isAdmin]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setAdminMsg(`Role updated to ${newRole}`);
        fetchAdminData();
      } else {
        setAdminMsg('Failed to update role.');
      }
    } catch {
      setAdminMsg('Error updating role.');
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        setAdminMsg(`User status updated to ${!currentActive ? 'Active' : 'Inactive'}`);
        fetchAdminData();
      } else {
        setAdminMsg('Failed to update user status.');
      }
    } catch {
      setAdminMsg('Error updating user status.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setAdminMsg(null);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      if (res.ok) {
        setAdminMsg(`Created ${newUserRole.toLowerCase()} account for ${newUserEmail.trim()}.`);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('STUDENT');
        fetchAdminData();
      } else {
        const err = await res.json().catch(() => ({}));
        setAdminMsg(err?.error?.message || err?.message || 'Failed to create account.');
      }
    } catch {
      setAdminMsg('Error creating account.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Delete account ${email}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok || res.status === 204) {
        setAdminMsg(`Deleted account ${email}.`);
        fetchAdminData();
      } else {
        const err = await res.json().catch(() => ({}));
        setAdminMsg(err?.error?.message || err?.message || 'Failed to delete account.');
      }
    } catch {
      setAdminMsg('Error deleting account.');
    }
  };

  return (
          <div>
            <div className="dash-welcome">
              <div>
                <h1 className="dash-title">Platform Administrative Console</h1>
                <p className="dash-subtitle">Monitor metrics, manage accounts, roles, and review security audit logs</p>
              </div>
              <button
                onClick={fetchAdminData}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                🔄 Refresh Data
              </button>
            </div>

            {adminMsg && (
              <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', background: 'var(--surface-card)', border: '1px solid var(--border-accent)', color: 'var(--primary-600)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{adminMsg}</span>
                <button onClick={() => setAdminMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
              </div>
            )}

            {/* High Level Platform Stats */}
            {adminStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div className="dash-mini-stat">
                  <span className="dash-mini-val">{adminStats.users?.total ?? 0}</span>
                  <span className="dash-mini-label">Total Users</span>
                </div>
                <div className="dash-mini-stat">
                  <span className="dash-mini-val">{adminStats.experiments?.totalSaved ?? 0}</span>
                  <span className="dash-mini-label">Saved Experiments</span>
                </div>
                <div className="dash-mini-stat">
                  <span className="dash-mini-val">{adminStats.academics?.classrooms ?? 0}</span>
                  <span className="dash-mini-label">Classrooms</span>
                </div>
                <div className="dash-mini-stat">
                  <span className="dash-mini-val">{adminStats.experiments?.activeShares ?? 0}</span>
                  <span className="dash-mini-label">Active Shares</span>
                </div>
              </div>
            )}

            {/* User Management Table */}
            <div style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>User Account Management</h3>

              <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr 0.9fr auto', gap: '10px', marginBottom: '20px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full name</label>
                  <input required value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Student name" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input required type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="name@college.edu" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Password</label>
                  <input required type="password" minLength={8} value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Min 8 characters" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Role</label>
                  <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
                    <option value="STUDENT">STUDENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <button type="submit" disabled={creatingUser} style={{ padding: '9px 14px', borderRadius: '6px', border: 'none', background: 'var(--gradient-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {creatingUser ? 'Creating…' : 'Create account'}
                </button>
              </form>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px' }}>Name</th>
                      <th style={{ padding: '10px 12px' }}>Email</th>
                      <th style={{ padding: '10px 12px' }}>Role</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: '12px' }}
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="TEACHER">TEACHER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: u.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: u.active ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                            {u.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleToggleStatus(u.id, u.active)}
                            style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Administrative Security Audit Logs</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 10px' }}>Timestamp</th>
                      <th style={{ padding: '8px 10px' }}>Action</th>
                      <th style={{ padding: '8px 10px' }}>Target ID</th>
                      <th style={{ padding: '8px 10px' }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{log.targetId || '-'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{log.ipAddress || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
  );
}
