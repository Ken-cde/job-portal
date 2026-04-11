import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Login failed. Please check your credentials.';
      setError(typeof msg === 'string' ? msg : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{maxWidth: '400px', margin: '4rem auto'}}>
      <div className="glass-panel" style={{padding: '2.5rem'}}>
        <h2 style={{marginBottom: '0.5rem', textAlign: 'center'}}>Welcome Back</h2>
        <p style={{color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem'}}>Log in to continue to JobPortal.</p>

        {error && <div style={{background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem'}}>{error}</div>}

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div style={{textAlign: 'right'}}>
            <Link to="/forgot-password" style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn-primary" style={{marginTop: '1rem', width: '100%'}} disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem'}}>
          <span style={{color: 'var(--text-muted)'}}>Don't have an account? </span>
          <Link to="/register" style={{fontWeight: '500'}}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
