import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OhmsLaw } from '../experiments/ohmsLaw/OhmsLaw';

interface SharedData {
  id: string;
  experimentId: string;
  title: string;
  notes?: string;
  state: Record<string, any>;
  ownerName: string;
  sharedAt: string;
}

export function SharedExperimentPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShare() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/share/${token}`);
        if (!res.ok) {
          if (res.status === 404 || res.status === 410) {
            setError('This shared experiment link is invalid, expired, or has been revoked by the author.');
          } else {
            setError('Failed to load shared experiment.');
          }
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError('Network error while loading shared experiment.');
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      loadShare();
    }
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="status-pulse" style={{ width: '16px', height: '16px', margin: '0 auto 16px' }} />
          <p>Loading shared simulation setup...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center', background: 'var(--surface-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
            ✕
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Link Unavailable</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            {error || 'This shared experiment could not be found.'}
          </p>
          <Link to="/" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--gradient-primary)', color: '#fff', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-primary)' }}>
      {/* Read-only Banner */}
      <div style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '12px', background: 'var(--badge-bg)', color: 'var(--primary-600)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, marginRight: '8px' }}>
            READ-ONLY SHARED VIEW
          </span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{data.title}</strong>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '10px' }}>
            by {data.ownerName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {data.notes && (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              "{data.notes}"
            </span>
          )}
          <Link to="/dashboard" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
            Go to Lab Dashboard →
          </Link>
        </div>
      </div>

      {/* Experiment */}
      {data.experimentId === 'ohms-law' ? (
        <OhmsLaw initialParameters={data.state} isReadOnly={true} />
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Simulation view for {data.experimentId}
        </div>
      )}
    </div>
  );
}
