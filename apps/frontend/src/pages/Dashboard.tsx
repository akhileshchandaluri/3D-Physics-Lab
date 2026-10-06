import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Dashboard.css';

// Exactly 8 canonical experiment IDs
const CANONICAL_EXPERIMENTS = [
  { id: 'ohms-law', code: 'Session 01', title: 'Introductory Session — Ohm\'s Law', path: '/experiments/ohms-law', available: true },
  { id: 'lattice-constant', code: 'Session 02', title: 'Determination of Lattice Constant', path: '', available: false },
  { id: 'lycopodium-laser', code: 'Session 03', title: 'Determination of Particle Size of Lycopodium Powder Using Laser', path: '', available: false },
  { id: 'youngs-modulus', code: 'Session 04', title: 'Determination of Young\'s Modulus — Uniform Bending Method', path: '', available: false },
  { id: 'creep-constant', code: 'Session 05', title: 'Determination of Creep Constant', path: '/experiments/creep-constant', available: true },
  { id: 'hall-effect', code: 'Session 06', title: 'Determination of Hall Coefficient Using Hall Effect', path: '', available: false },
  { id: 'plancks-constant', code: 'Session 07', title: 'Determination of Planck\'s Constant', path: '', available: false },
  { id: 'solar-cell', code: 'Session 08', title: 'Solar Cell Characteristics', path: '', available: false },
];

const AtomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>
);

export function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'catalog' | 'saved' | 'classroom' | 'admin'>('catalog');

  // --- Saved Experiments State ---
  const [savedList, setSavedList] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedActionMsg, setSavedActionMsg] = useState<string | null>(null);

  // --- Classroom State ---
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [selectedClassDetails, setSelectedClassDetails] = useState<any | null>(null);
  const [classActionMsg, setClassActionMsg] = useState<string | null>(null);

  // New assignment modal
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignExpId, setAssignExpId] = useState('ohms-law');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isCreatingAssign, setIsCreatingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Submissions modal
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

  // Student submission
  const [submitExpId, setSubmitExpId] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState<string | null>(null); // assignmentId

  // --- Admin State ---
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  // --- Fetch Saved Experiments ---
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

  // --- Fetch Classrooms ---
  const fetchClassrooms = useCallback(async () => {
    if (isTeacherOrAdmin) {
      try {
        const res = await fetch('/api/v1/teacher/classrooms', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setTeacherClasses(data.classrooms || []);
        }
      } catch {}
    }
    // Student enrolled
    try {
      const res = await fetch('/api/v1/teacher/classrooms/enrolled', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEnrolledClasses(data.classrooms || []);
      }
    } catch {}
  }, [isTeacherOrAdmin]);

  // --- Fetch Admin Data ---
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
    if (activeTab === 'saved') fetchSaved();
    if (activeTab === 'classroom') fetchClassrooms();
    if (activeTab === 'admin') fetchAdminData();
  }, [activeTab, fetchSaved, fetchClassrooms, fetchAdminData]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // --- Saved Experiment Actions ---
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

  // --- Classroom Actions ---
  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      const res = await fetch('/api/v1/teacher/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });
      if (res.ok) {
        setClassActionMsg('Joined classroom successfully!');
        setJoinCode('');
        fetchClassrooms();
      } else {
        const err = await res.json().catch(() => ({}));
        setClassActionMsg(err?.error?.message || err?.message || 'Failed to join classroom.');
      }
    } catch {
      setClassActionMsg('Error joining classroom.');
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newClassCode) return;
    try {
      const res = await fetch('/api/v1/teacher/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newClassName,
          subject: newClassSubject || 'Physics',
          code: newClassCode.trim().toUpperCase(),
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const createdCode = data.code || newClassCode;
        setClassActionMsg(`Classroom created successfully! Enrollment code: ${createdCode}`);
        setNewClassName('');
        setNewClassSubject('');
        setNewClassCode('');
        fetchClassrooms();
      } else {
        const err = await res.json().catch(() => ({}));
        setClassActionMsg(err?.error?.message || err?.message || 'Failed to create classroom.');
      }
    } catch {
      setClassActionMsg('Error creating classroom.');
    }
  };

  const handleViewClassDetails = async (classId: string) => {
    try {
      const res = await fetch(`/api/v1/teacher/classrooms/${classId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedClassDetails(data);
      }
    } catch {}
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) {
      setAssignError('Assignment title is required.');
      return;
    }
    const classId = selectedClassDetails?.classroom?.id || selectedClassDetails?.id;
    if (!classId) {
      setAssignError('Target classroom is not selected. Please select a classroom first.');
      return;
    }

    setIsCreatingAssign(true);
    setAssignError(null);

    try {
      let formattedDueAt: string;
      if (assignDueDate && assignDueDate.trim()) {
        formattedDueAt = new Date(assignDueDate + 'T23:59:59Z').toISOString();
      } else {
        formattedDueAt = new Date(Date.now() + 7 * 86400000).toISOString();
      }

      const res = await fetch(`/api/v1/teacher/classrooms/${classId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: assignTitle.trim(),
          instructions: assignDesc.trim(),
          description: assignDesc.trim(),
          experimentId: assignExpId,
          dueAt: formattedDueAt,
          dueDate: formattedDueAt,
        }),
      });

      if (res.ok) {
        setClassActionMsg('Assignment created successfully!');
        setShowAssignModal(false);
        setAssignTitle('');
        setAssignDesc('');
        setAssignDueDate('');
        setAssignError(null);
        handleViewClassDetails(classId);
        fetchClassrooms();
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || err?.message || 'Failed to create assignment.';
        setAssignError(msg);
        setClassActionMsg(msg);
      }
    } catch {
      setAssignError('Network error occurred while creating assignment.');
      setClassActionMsg('Error creating assignment.');
    } finally {
      setIsCreatingAssign(false);
    }
  };

  const handleViewSubmissions = async (assignmentId: string) => {
    setShowSubmissionsModal(true);
    try {
      const res = await fetch(`/api/v1/teacher/assignments/${assignmentId}/submissions`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSubmissionsList(data.submissions || []);
      }
    } catch {}
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubmitModal || !submitExpId) return;
    try {
      const res = await fetch(`/api/v1/teacher/assignments/${showSubmitModal}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          savedExperimentId: submitExpId,
          notes: submitNotes,
        }),
      });
      if (res.ok) {
        setClassActionMsg('Experiment submitted successfully!');
        setShowSubmitModal(null);
        setSubmitExpId('');
        setSubmitNotes('');
        fetchClassrooms();
      } else {
        const err = await res.json().catch(() => ({}));
        setClassActionMsg(err?.error?.message || err?.message || 'Failed to submit assignment.');
      }
    } catch {
      setClassActionMsg('Error submitting assignment.');
    }
  };

  // --- Admin Actions ---
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

  return (
    <div className="dashboard">
      {/* Background */}
      <div className="dash-bg">
        <div className="dash-orb dash-orb-1" />
        <div className="dash-orb dash-orb-2" />
      </div>

      {/* Top bar */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <Link to="/dashboard" className="dash-brand">
            <div className="dash-brand-icon"><AtomIcon /></div>
            <span>PhySim Lab</span>
          </Link>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'catalog' ? 'var(--gradient-primary)' : 'transparent',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Experiments Catalog
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'saved' ? 'var(--gradient-primary)' : 'transparent',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Saved Experiments
            </button>
            <button
              onClick={() => setActiveTab('classroom')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'classroom' ? 'var(--gradient-primary)' : 'transparent',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Classroom & Assignments
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'admin' ? 'var(--gradient-primary)' : 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Admin Console
              </button>
            )}
          </nav>

          <div className="dash-user-area">
            <div className="dash-avatar">{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            <div className="dash-user-info">
              <span className="dash-user-name">{user?.name ?? 'Student'}</span>
              <span className="dash-user-email">
                {user?.email ?? ''} • <strong style={{ color: 'var(--primary-600)' }}>{user?.role}</strong>
              </span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              )}
            </button>
            <button className="dash-logout" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dash-main">
        <div className="dash-main-inner">

          {/* ================= TAB 1: EXPERIMENTS CATALOG ================= */}
          {activeTab === 'catalog' && (
            <div>
              <div className="dash-welcome">
                <div>
                  <h1 className="dash-title">Canonical Experiment Catalog</h1>
                  <p className="dash-subtitle">Eight standard university virtual physics laboratory simulations</p>
                </div>
                <div className="dash-stats-row">
                  <div className="dash-mini-stat">
                    <span className="dash-mini-val">8</span>
                    <span className="dash-mini-label">Canonical Labs</span>
                  </div>
                  <div className="dash-mini-stat">
                    <span className="dash-mini-val">1</span>
                    <span className="dash-mini-label">Interactive</span>
                  </div>
                  <div className="dash-mini-stat">
                    <span className="dash-mini-val">7</span>
                    <span className="dash-mini-label">Catalog Ready</span>
                  </div>
                </div>
              </div>

              <div className="sessions-list">
                {CANONICAL_EXPERIMENTS.map((s, i) => (
                  <div
                    key={s.id}
                    className={`session-card ${s.available ? 'session-available' : 'session-locked'}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="session-number">
                      <span>{String(i + 1).padStart(2, '0')}</span>
                    </div>

                    <div className="session-info">
                      <span className="session-code">{s.code} • ID: {s.id}</span>
                      <h3 className="session-title">{s.title}</h3>
                    </div>

                    <div className="session-action">
                      {s.available ? (
                        <span className="session-status status-live">
                          <span className="status-pulse" />
                          Live Simulation
                        </span>
                      ) : (
                        <span className="session-status status-soon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          Catalog Spec
                        </span>
                      )}

                      {s.available ? (
                        <Link to={s.path} className="session-launch-btn">
                          Launch Simulation
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </Link>
                      ) : (
                        <span className="session-launch-btn disabled">
                          Specification Ready
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 2: SAVED EXPERIMENTS ================= */}
          {activeTab === 'saved' && (
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
          )}

          {/* ================= TAB 3: CLASSROOM & ASSIGNMENTS ================= */}
          {activeTab === 'classroom' && (
            <div>
              <div className="dash-welcome">
                <div>
                  <h1 className="dash-title">Classrooms & Assignments</h1>
                  <p className="dash-subtitle">Collaborate in virtual labs, manage student cohorts, and submit homework</p>
                </div>
              </div>

              {classActionMsg && (
                <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', background: 'var(--surface-card)', border: '1px solid var(--border-accent)', color: 'var(--primary-600)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{classActionMsg}</span>
                  <button onClick={() => setClassActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                </div>
              )}

              {/* Student Enrollment Section */}
              <div style={{ display: 'grid', gridTemplateColumns: isTeacherOrAdmin ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '32px' }}>
                {/* Join Classroom Card */}
                <div style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Join a Classroom</h3>
                  <form onSubmit={handleJoinClassroom} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Enter Code (e.g. PHY101)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: '14px' }}
                    />
                    <button type="submit" style={{ padding: '10px 20px', background: 'var(--gradient-primary)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      Join
                    </button>
                  </form>
                </div>

                {/* Teacher Create Classroom Card */}
                {isTeacherOrAdmin && (
                  <div style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Create New Classroom (Teacher)</h3>
                    <form onSubmit={handleCreateClassroom} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="Class Name"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          required
                          style={{ flex: 2, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                        />
                        <input
                          type="text"
                          placeholder="Code (e.g. PHY202)"
                          value={newClassCode}
                          onChange={(e) => setNewClassCode(e.target.value)}
                          required
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                        />
                      </div>
                      <button type="submit" style={{ alignSelf: 'flex-start', padding: '8px 16px', background: 'var(--gradient-primary)', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                        Create Classroom
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Student's Enrolled Classrooms & Assignments */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Enrolled Classrooms & Homework</h2>
                {enrolledClasses.length === 0 ? (
                  <div style={{ padding: '24px', background: 'var(--surface-card)', borderRadius: '12px', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    You are not currently enrolled in any classrooms. Enter an enrollment code above (e.g. <code>PHY101</code>) to join.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {enrolledClasses.map((item) => {
                      const clsId = item.classroom?.id || item.classroomId || item.id || item.membershipId;
                      const clsName = item.classroom?.name || item.name || 'Classroom';
                      const clsCode = item.classroom?.code || item.code || '';
                      const teacher = item.classroom?.teacherName || item.teacherName || 'Instructor';
                      return (
                        <div key={clsId} style={{ background: 'var(--surface-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{clsName}</strong>
                              <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Code: <strong>{clsCode}</strong> • Instructor: {teacher}</span>
                            </div>
                            <span style={{ fontSize: '12px', background: 'var(--badge-bg)', color: 'var(--primary-600)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Enrolled</span>
                          </div>

                          {/* Assignments in Classroom */}
                          {item.assignments && item.assignments.length > 0 ? (
                            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Active Assignments:</div>
                              {item.assignments.map((ass: any) => (
                                <div key={ass.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-primary)', padding: '12px 16px', borderRadius: '8px', marginBottom: '8px' }}>
                                  <div>
                                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{ass.title}</strong>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                                      {ass.dueAt || ass.dueDate ? `Due: ${new Date(ass.dueAt || ass.dueDate).toLocaleDateString()}` : ''} • Lab: {ass.experimentId}
                                    </span>
                                    {(ass.instructions || ass.description) && (
                                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{ass.instructions || ass.description}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      fetchSaved();
                                      setShowSubmitModal(ass.id);
                                    }}
                                    style={{ padding: '6px 12px', background: 'var(--gradient-primary)', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Submit Run
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>No pending assignments in this class.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Teacher Managed Classrooms Section */}
              {isTeacherOrAdmin && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Teacher Dashboard — Managed Cohorts</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {teacherClasses.map((cls) => (
                      <div key={cls.id} style={{ background: 'var(--surface-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{cls.name}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>Subject: {cls.subject} • Enrollment Code: <strong style={{ color: 'var(--primary-600)' }}>{cls.code}</strong></span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleViewClassDetails(cls.id)}
                              style={{ padding: '6px 14px', background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
                            >
                              Manage Roster & Assignments
                            </button>
                          </div>
                        </div>

                        {/* Selected class expanded view */}
                        {selectedClassDetails?.classroom?.id === cls.id && (
                          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                                Enrolled Students ({selectedClassDetails.studentCount}) & Assignments ({selectedClassDetails.assignments?.length || 0})
                              </h4>
                              <button
                                onClick={() => {
                                  setAssignError(null);
                                  setShowAssignModal(true);
                                }}
                                style={{ padding: '6px 12px', background: 'var(--gradient-primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                + New Assignment
                              </button>
                            </div>

                            {/* Assignments list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                              {selectedClassDetails.assignments?.map((ass: any) => (
                                <div key={ass.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-primary)', padding: '10px 14px', borderRadius: '6px' }}>
                                  <div>
                                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{ass.title}</strong>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>Lab: {ass.experimentId} • Due: {new Date(ass.dueDate).toLocaleDateString()}</span>
                                  </div>
                                  <button
                                    onClick={() => handleViewSubmissions(ass.id)}
                                    style={{ padding: '4px 10px', background: 'var(--toggle-bg)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
                                  >
                                    View Submissions
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Roster preview */}
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              <strong>Roster:</strong> {selectedClassDetails.roster?.map((r: any) => r.studentName).join(', ') || selectedClassDetails.students?.map((s: any) => s.name).join(', ') || 'No students enrolled yet.'}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: ADMIN CONSOLE ================= */}
          {activeTab === 'admin' && isAdmin && (
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
                    <span className="dash-mini-val">{adminStats.totalUsers}</span>
                    <span className="dash-mini-label">Total Users</span>
                  </div>
                  <div className="dash-mini-stat">
                    <span className="dash-mini-val">{adminStats.totalExperiments}</span>
                    <span className="dash-mini-label">Saved Experiments</span>
                  </div>
                  <div className="dash-mini-stat">
                    <span className="dash-mini-val">{adminStats.totalClassrooms}</span>
                    <span className="dash-mini-label">Classrooms</span>
                  </div>
                  <div className="dash-mini-stat">
                    <span className="dash-mini-val">{adminStats.activeShares}</span>
                    <span className="dash-mini-label">Active Shares</span>
                  </div>
                </div>
              )}

              {/* User Management Table */}
              <div style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>User Account Management</h3>
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
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleToggleStatus(u.id, u.active)}
                              style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                            >
                              {u.active ? 'Deactivate' : 'Activate'}
                            </button>
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
          )}

        </div>
      </main>

      {/* --- MODAL: Create Assignment --- */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '480px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Create Lab Assignment</h3>
            {assignError && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '13px' }}>
                {assignError}
              </div>
            )}
            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assignment Title</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Verification of Ohm's Law"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description / Lab Instructions</label>
                <textarea
                  rows={3}
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Detailed laboratory instructions or expectations..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Canonical Experiment</label>
                <select
                  value={assignExpId}
                  onChange={(e) => setAssignExpId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
                >
                  {CANONICAL_EXPERIMENTS.map((e) => (
                    <option key={e.id} value={e.id}>{e.title} ({e.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Due Date</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  disabled={isCreatingAssign}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAssign}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: isCreatingAssign ? 'var(--border-subtle)' : 'var(--gradient-primary)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: isCreatingAssign ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isCreatingAssign ? 'Creating Assignment...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Student Submit Assignment --- */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '480px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Submit Saved Experiment</h3>
            <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Select Saved Experiment Run</label>
                {savedList.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#ef4444' }}>No saved experiments found. Please save a simulation first.</p>
                ) : (
                  <select
                    required
                    value={submitExpId}
                    onChange={(e) => setSubmitExpId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Choose a saved experiment --</option>
                    {savedList.map((s) => (
                      <option key={s.id} value={s.id}>{s.title} ({s.experimentId}) - {new Date(s.createdAt).toLocaleDateString()}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Submission Notes / Observations</label>
                <textarea
                  rows={3}
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="Explain your experimental findings..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!submitExpId}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--gradient-primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Teacher View Submissions --- */}
      {showSubmissionsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '600px', border: '1px solid var(--border-subtle)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Student Submissions</h3>
              <button onClick={() => setShowSubmissionsModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            {submissionsList.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No student submissions for this assignment yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {submissionsList.map((sub: any) => (
                  <div key={sub.id} style={{ background: 'var(--surface-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{sub.studentName}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(sub.submittedAt).toLocaleString()}</span>
                    </div>
                    {sub.notes && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0' }}>"{sub.notes}"</p>}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Experiment State: <code>{JSON.stringify(sub.experimentState)}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
