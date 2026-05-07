import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';

interface QuestSummary {
  id: string;
  name: string;
  exerciseCount: number;
}

const AdminDashboard: React.FC = () => {
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/quests', { credentials: 'include' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${response.status}: Failed to fetch quests`);
      }
      const data = await response.json();
      setQuests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete ${id}?`)) return;
    try {
      const response = await fetch(`/api/v1/admin/quests/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete quest');
      fetchQuests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="app-container fade-in">
      <header>
        <div>
          <h1 style={{ fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Admin</h1>
          <p style={{ marginTop: '0.25rem' }}>Management hub for Quests and Exercises</p>
        </div>
        <Link to="/admin/quest/new" className="btn btn-primary btn-small">
          + Create New Quest
        </Link>
        <a className="btn btn-secondary btn-small" href={import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174/admin/dashboard'}>
          Back to Admin
        </a>
      </header>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '200px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="dashboard-notice" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
          Error: {error}
        </div>
      ) : (
        <div className="dashboard-grid">
          {quests.map((quest) => (
            <div key={quest.id} className="quest-card">
              <div className="quest-header">
                <div>
                  <div className="quest-id">{quest.id}</div>
                  <h3 style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>{quest.name}</h3>
                </div>
                <div className="status-badge status-completed">
                  {quest.exerciseCount} Exercises
                </div>
              </div>
              <div className="quest-actions" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <Link to={`/admin/quest/${quest.id}`} className="btn btn-secondary btn-small">
                  Edit Logic
                </Link>
                <a 
                  href={`${import.meta.env.VITE_GITEA_WEB_URL || 'http://localhost:3001'}/${import.meta.env.VITE_GITEA_TEMPLATE_OWNER || 'curriculum-team'}/quest-${quest.id.replace('quest-', '')}-template`}
                  className="btn btn-secondary btn-small"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitBranch size={12} style={{ marginRight: 4 }} /> Template
                </a>
                <button 
                  onClick={() => handleDelete(quest.id)} 
                  className="btn btn-small" 
                  style={{ borderColor: 'var(--error)', color: 'var(--error)', background: 'rgba(255, 95, 115, 0.05)' }}
                >
                  Terminate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {quests.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No quests found in templates/ directory.
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
