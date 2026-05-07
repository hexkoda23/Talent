import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.tsx';
import { BookOpen, ExternalLink, Trophy, ShieldCheck, CheckSquare, Clock } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'LOCKED' | 'IN_PROGRESS' | 'TESTING' | 'READY_FOR_AUDIT' | 'WAITING_FOR_AUDIT' | 'AUDITING' | 'COMPLETED' | 'FAILED';
}

interface StudentProgress {
  quest_id: string;
  status: Quest['status'];
}

interface StartQuestResponse {
  repoUrl?: string;
  giteaWarning?: string;
}

// Quests will be fetched from the API
const INITIAL_QUESTS: Quest[] = [];

const COMPLETED_STATUSES: Quest['status'][] = ['COMPLETED'];

interface AuditSession {
  id: number;
  auditee: string;
  auditor: string;
  quest_id: string;
  exercise_id: string;
  repo_url: string;
  status: string;
  expires_at: string;
}

interface AuditQueueItem {
  username: string;
  quest_id: string;
  exercise_id: string;
  joined_at: string;
  waiting_since: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [loading, setLoading] = useState<string | null>(null);
  const [questRepoUrls, setQuestRepoUrls] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const location = useLocation();
  const view = location.pathname === '/audits' ? 'audit' : 'quests';
  
  // Audit State
  const [auditQueue, setAuditQueue] = useState<AuditQueueItem[]>([]);
  const [myAuditSessions, setMyAuditSessions] = useState<AuditSession[]>([]);
  const [myPendingDefenses, setMyPendingDefenses] = useState<AuditQueueItem[]>([]);
  const [auditPoints, setAuditPoints] = useState(0);
  const [studentStats, setStudentStats] = useState({ level: 1, xp: 0 });
  const [isBooking, setIsBooking] = useState(false);

  const applyQuestLocks = (questsToLock: Quest[]): Quest[] => (
    questsToLock.map((quest, index) => {
      if (index === 0) {
        return quest.status === 'LOCKED' ? { ...quest, status: 'IN_PROGRESS' as Quest['status'] } : quest;
      }

      const previousQuest = questsToLock[index - 1];
      const isUnlocked = COMPLETED_STATUSES.includes(previousQuest.status);
      if (!isUnlocked) {
        return { ...quest, status: 'LOCKED' as Quest['status'] };
      }

      return quest.status === 'LOCKED' ? { ...quest, status: 'IN_PROGRESS' as Quest['status'] } : quest;
    })
  );

  // Fetch real progress and quest catalog on load
  useEffect(() => {
    if (user) {
      const loadDashboard = async () => {
        try {
          // 1. Fetch Quest Catalog
          const catalogRes = await fetch('/api/v1/quests', { credentials: 'include' });
          const catalogData = await catalogRes.json();
          const baseQuests: Quest[] = catalogData.map((q: any) => ({
            id: q.id,
            title: q.title,
            description: q.description,
            status: 'LOCKED' as Quest['status'],
            exerciseCount: q.exerciseCount,
            xp: q.xp,
            level: q.level
          }));

          // 2. Fetch Student Progress
          const progressRes = await fetch('/api/v1/me/progress', { credentials: 'include' });
          const progressData = await progressRes.json();
          
          if (progressData.progress) {
            const updatedQuests = baseQuests.map(q => {
              // Match progress ID (handle both '00' and 'quest-00')
              const shortId = q.id.replace('quest-', '');
              const prog = (progressData.progress as StudentProgress[]).find((p) => 
                p.quest_id === q.id || p.quest_id === shortId
              );
              return prog ? { ...q, status: prog.status } : q;
            });
            const gatedQuests = applyQuestLocks(updatedQuests);
            setQuests(gatedQuests);

            const accessibleQuests = gatedQuests.filter(q => q.status !== 'LOCKED');
            const accessResults = await Promise.all(accessibleQuests.map(q =>
              fetch(`/api/v1/quests/${q.id}/access`, { credentials: 'include' }).then(res => res.ok ? res.json() : null)
            ));

            const urls = accessResults.reduce((acc: Record<string, string>, access, index) => {
              if (access?.repoUrl) acc[accessibleQuests[index].id] = access.repoUrl;
              return acc;
            }, {});
            setQuestRepoUrls(urls);
          } else {
            setQuests(applyQuestLocks(baseQuests));
          }
        } catch (err) {
          console.error('Dashboard load error:', err);
        }
      };

      const loadProfile = async () => {
        try {
          const profileRes = await fetch('/api/v1/me/profile', { credentials: 'include' });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setStudentStats({ level: profileData.level, xp: profileData.xp });
          }
        } catch (err) {
          console.error('Profile load error:', err);
        }
      };

      loadDashboard();
      loadAudits();
      loadProfile();

      // Poll for updates every 10 seconds
      const interval = setInterval(() => {
        loadDashboard();
        loadAudits();
        loadProfile();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadAudits = async () => {
    if (!user) return;
    try {
      const [queueRes, sessionsRes] = await Promise.all([
        fetch('/api/v1/audits/queue', { credentials: 'include' }),
        fetch('/api/v1/audit/my', { credentials: 'include' })
      ]);

      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setAuditQueue(queueData.queue || []);
        setAuditPoints(queueData.auditPoints || 0);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setMyAuditSessions(sessionsData.sessions || []);
        setMyPendingDefenses(sessionsData.queue || []);
      }
    } catch (err) {
      console.error('Audit load error:', err);
    }
  };

  const bookAudit = async (item: AuditQueueItem) => {
    if (!user || isBooking) return;
    setIsBooking(true);
    try {
      const res = await fetch('/api/v1/audits/book', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auditee: item.username,
          questId: item.quest_id,
          exerciseId: item.exercise_id
        })
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/audit/${data.session.id}`);
      } else {
        alert(data.error || 'Failed to book audit');
      }
    } catch (err) {
      alert('Could not book audit');
    } finally {
      setIsBooking(false);
    }
  };

  const startQuest = async (questId: string) => {
    if (!user) return;
    setLoading(questId);
    setNotice('');
    try {
      const response = await fetch(`/api/v1/quests/${questId}/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questId })
      });

      if (response.ok) {
        const data: StartQuestResponse = await response.json();
        setQuests(prev => prev.map(q => 
          q.id === questId ? { ...q, status: 'IN_PROGRESS' } : q
        ));
        const repoUrl = data.repoUrl;
        if (repoUrl) {
          setQuestRepoUrls(prev => ({ ...prev, [questId]: repoUrl }));
        }
        if (data.giteaWarning) {
          setNotice(`Workspace opened. Gitea provisioning needs attention: ${data.giteaWarning}`);
        }
        navigate(`/quest/${questId}`);
      } else {
        const err = await response.json();
        alert(`Failed to start quest: ${err.error}`);
      }
    } catch {
      alert('Could not connect to the middleware API.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="app-container">
      <header className="fade-in">
        <div>
          <div className="topbar-title">
            <span 
              className={`nav-link ${view === 'quests' ? 'active' : ''}`} 
              onClick={() => navigate('/quests')}
            >
              <span className="accent">▸</span> Quest Catalog
            </span>
            <span 
              className={`nav-link ${view === 'audit' ? 'active' : ''}`} 
              style={{ marginLeft: '2rem' }}
              onClick={() => navigate('/audits')}
            >
              <span className="accent">▸</span> Audit Center
            </span>
          </div>
          <div className="topbar-sub">middleware://online ▸ socket://live ▸ runner://multi-lang</div>
        </div>
        <div className="user-profile">
          <a className="btn btn-small" href={import.meta.env.VITE_USER_APP_URL || 'http://localhost:5173/dashboard'}>
            Back to TalentNation
          </a>
          <div style={{ textAlign: 'right', marginRight: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="stat-pills-mini">
              <span className="stat-pill-mini"><Trophy size={10} /> {studentStats.xp} XP</span>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{user?.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-small" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-grid">
        {notice && <div className="dashboard-notice">{notice}</div>}
        
        {view === 'quests' ? (
          quests.map((quest, index) => (
            <div
              key={quest.id} 
              className="quest-card fade-in" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="quest-cover-bar" style={{ background: index === 1 ? 'var(--purple)' : index === 2 ? 'var(--orange)' : 'var(--cyan)' }} />
              <div className="quest-header">
                <span className="quest-id">Quest {quest.id}</span>
                <span className={`status-badge status-${quest.status.toLowerCase().replace(/_/g, '-')}`}>
                  {quest.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h3>{quest.title}</h3>
              <p>{quest.description}</p>
              <div className="quest-meta">
                 <span><BookOpen size={12} style={{ verticalAlign: -2, marginRight: 4 }} /><strong>{(quest as any).exerciseCount ?? (index + 3)}</strong> exercises</span>
                 <span><Trophy size={12} style={{ verticalAlign: -2, marginRight: 4 }} /><strong>{(quest as any).xp ?? ((index + 1) * 250)}</strong> XP</span>
               </div>
              
              <div className="quest-actions">
                {quest.status === 'LOCKED' && index > 0 && (
                  <div className="dashboard-notice">
                    Complete Quest {quests[index - 1]?.id?.replace('quest-', '')} first.
                  </div>
                )}
                <button 
                  className="btn btn-primary"
                  disabled={quest.status === 'LOCKED' || loading === quest.id}
                  onClick={() => (questRepoUrls[quest.id] ? navigate(`/quest/${quest.id}`) : startQuest(quest.id))}
                >
                  {loading === quest.id ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      {quest.status === 'LOCKED' ? 'Locked' :
                       quest.status === 'IN_PROGRESS' ? 'Open Workspace' : 'View Results'}
                    </>
                  )}
                </button>

                {questRepoUrls[quest.id] && (
                  <a className="btn btn-secondary" href={questRepoUrls[quest.id]}>
                    <ExternalLink size={16} /> Open Gitea
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="audit-center-view fade-in" style={{ gridColumn: '1 / -1' }}>
            <div className="audit-stats-header">
              <div className="stat-pill">
                <ShieldCheck size={18} />
                <span>Audit Power: <strong>{auditPoints}</strong></span>
              </div>
            </div>

            <div className="audit-sections">
              <section>
                <h2 className="section-title"><Clock size={18} /> My Pending Defenses</h2>
                <div className="audit-list">
                  {myPendingDefenses.length > 0 ? myPendingDefenses.map((item, idx) => (
                    <div key={idx} className="audit-item-card" style={{ borderColor: 'var(--yellow)' }}>
                      <div className="audit-item-header">
                        <span className="audit-tag" style={{ color: 'var(--yellow)' }}>{item.quest_id} / {item.exercise_id}</span>
                        <span className="audit-status" style={{ color: 'var(--yellow)' }}>WAITING</span>
                      </div>
                      <div className="audit-item-body">
                        <strong>Ready for Defense</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You joined the queue at {new Date(item.joined_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state">You have no exercises waiting for defense.</div>
                  )}
                </div>
              </section>

              <section style={{ marginTop: '3rem' }}>
                <h2 className="section-title"><ShieldCheck size={18} /> My Active Sessions</h2>
                <div className="audit-list">
                  {myAuditSessions.length > 0 ? myAuditSessions.map(session => (
                    <div key={session.id} className="audit-item-card">
                      <div className="audit-item-header">
                        <span className="audit-tag">{session.quest_id} / {session.exercise_id}</span>
                        <span className="audit-status">{session.status}</span>
                      </div>
                      <div className="audit-item-body">
                        <div className="audit-user-info">
                          <span className="label">Auditee:</span>
                          <strong>{session.auditee}</strong>
                        </div>
                        <div className="audit-user-info">
                          <span className="label">Auditor:</span>
                          <strong>{session.auditor}</strong>
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={() => navigate(`/audit/${session.id}`)}
                      >
                        Enter Workspace
                      </button>
                    </div>
                  )) : (
                    <div className="empty-state">No active audit sessions.</div>
                  )}
                </div>
              </section>

              <section style={{ marginTop: '3rem' }}>
                <h2 className="section-title"><CheckSquare size={18} /> Available for Defense</h2>
                <div className="audit-list">
                  {auditQueue.length > 0 ? auditQueue.map((item, idx) => (
                    <div key={idx} className="audit-item-card">
                      <div className="audit-item-header">
                        <span className="audit-tag">{item.quest_id} / {item.exercise_id}</span>
                      </div>
                      <div className="audit-item-body">
                        <strong>{item.username}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Waiting since {new Date(item.waiting_since).toLocaleTimeString()}</span>
                      </div>
                      <button 
                        className="btn btn-secondary btn-small"
                        disabled={isBooking}
                        onClick={() => bookAudit(item)}
                      >
                        Accept Audit
                      </button>
                    </div>
                  )) : (
                    <div className="empty-state">The defense queue is currently empty.</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        &copy; 2026 LMS Middleware Engine - Multi-Account Secure Access
      </footer>
    </div>
  )
}
