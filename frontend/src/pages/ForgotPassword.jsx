import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please check your email address.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '420px', margin: '4rem auto' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Mail size={28} color="var(--primary)" />
          <h2 style={{ margin: 0 }}>Reset Password</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#10b981' }}>
              <Mail size={28} />
            </div>
            <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Check your inbox!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              We've sent a password reset link to <strong>{email}</strong>. The link expires in 15 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem' }}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Remember your password? </span>
          <Link to="/login" style={{ fontWeight: '500' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
