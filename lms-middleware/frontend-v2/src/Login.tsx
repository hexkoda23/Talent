import { useState } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/v1/auth/register' : '/api/v1/auth/login';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegister ? 'Join the system intelligence' : 'Login to your control panel'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="e.g. dotunbey" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="dotun@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          )}

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <div className="loading-spinner"></div> : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Login here' : 'Register now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
