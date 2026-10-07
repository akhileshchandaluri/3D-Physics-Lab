import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export function SavedExperimentsPage() {
  const [savedList, setSavedList] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedActionMsg, setSavedActionMsg] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/v1/experiments?page=1&limit=50', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSavedList(data.items || []);
      }
    } catch {
      // Ignore fetch error
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleDeleteSaved = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved experiment?')) return;
    try {
      const res = await fetch(`/api/v1/experiments/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setSavedActionMsg('Experiment deleted successfully.');
        fetchSaved();
      } else {
        setSavedActionMsg('Failed to delete experiment.');
      }
    } catch {
      setSavedActionMsg('Network error while deleting experiment.');
    }
  };

  const handleCreateShareLink = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/experiments/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        const shareLink = `${window.location.origin}/share/${data.token}`;
        navigator.clipboard?.writeText(shareLink).catch(() => {});
        setSavedActionMsg(`Share link generated & copied: ${shareLink}`);
        fetchSaved();
      } else {
        setSavedActionMsg('Failed to create share link.');
      }
    } catch {
      setSavedActionMsg('Error generating share link.');
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      const res = await fetch(`/api/v1/share/${shareId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setSavedActionMsg('Share link revoked successfully.');
        fetchSaved();
      } else {
        setSavedActionMsg('Failed to revoke share link.');
      }
    } catch {
      setSavedActionMsg('Error revoking share link.');
    }
  };

  return (
          <div>
            <div className="dash-welcome">
              <div>
                <h1 className="dash-title">My Saved Experiments</h1>
                <p className="dash-subtitle">Manage, resume, update, and share your simulated laboratory setups</p>
              </div>
              <button
                onClick={fetchSaved}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                🔄 Refresh
              </button>
            </div>

            {savedActionMsg && (
              <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', background: 'var(--surface-card)', border: '1px solid var(--border-accent)', color: 'var(--primary-600)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{savedActionMsg}</span>
                <button onClick={() => setSavedActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
              </div>
            )}

            {loadingSaved ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading saved experiments...</div>
            ) : savedList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '15px' }}>You have not saved any experiment states yet.</p>
                <Link to="/experiments/ohms-law" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--gradient-primary)', color: '#fff', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
                  Launch Ohm's Law & Save a Setup →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {savedList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '20px 24px',
                      borderRadius: '12px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', background: 'var(--badge-bg)', color: 'var(--primary-600)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {item.experimentId}
                        </span>
                        <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{item.title}</strong>
                      </div>
                      {item.notes && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0' }}>{item.notes}</p>}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Parameters: {JSON.stringify(item.stateData || item.state)} • Saved: {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link
                        to={`/experiments/${item.experimentId}?savedId=${item.id}`}
                        style={{ padding: '8px 14px', background: 'var(--gradient-primary)', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Reopen & Edit
                      </Link>
                      <button
                        onClick={() => handleCreateShareLink(item.id)}
                        style={{ padding: '8px 14px', background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        🔗 Share Link
                      </button>
                      <button
                        onClick={() => {
                          const sid = prompt('Enter Share ID to revoke:');
                          if (sid) handleRevokeShare(sid.trim());
                        }}
                        style={{ padding: '8px 14px', background: 'var(--toggle-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Revoke Share
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(item.id)}
                        style={{ padding: '8px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
  );
}
