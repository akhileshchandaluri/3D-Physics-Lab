import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CANONICAL_EXPERIMENT_OPTIONS } from './CatalogPage';
import './Dashboard.css';

export function ClassroomsPage() {
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [selectedClassDetails, setSelectedClassDetails] = useState<any | null>(null);
  const [classActionMsg, setClassActionMsg] = useState<string | null>(null);

  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignExpId, setAssignExpId] = useState('ohms-law');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isCreatingAssign, setIsCreatingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

  const [savedList, setSavedList] = useState<any[]>([]);
  const [submitExpId, setSubmitExpId] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/experiments?page=1&limit=50', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSavedList(data.items || []);
      }
    } catch {}
  }, []);

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
    try {
      const res = await fetch('/api/v1/teacher/classrooms/enrolled', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEnrolledClasses(data.classrooms || []);
      }
    } catch {}
  }, [isTeacherOrAdmin]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

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

  return (
    <>
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
                {CANONICAL_EXPERIMENT_OPTIONS.map((e) => (
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
    </>
  );
}
