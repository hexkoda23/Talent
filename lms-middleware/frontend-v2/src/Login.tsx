export default function Login() {
  const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:5173/dashboard';
  const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174/admin/dashboard';

  return (
    <div className="auth-wrapper">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1>Launch Required</h1>
          <p>Quests and audits open from TalentNation so your platform session can follow you into Gitea.</p>
        </div>
        <div className="quest-actions" style={{ gridTemplateColumns: '1fr', marginTop: '1.5rem' }}>
          <a className="btn btn-primary" href={userAppUrl}>Return to TalentNation</a>
          <a className="btn btn-secondary" href={adminAppUrl}>Return to Admin</a>
        </div>
      </div>
    </div>
  );
}
