import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({username: '', email: '', password: ''});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      // 1. Register the user
      await api.post('/auth/register', formData);
      // 2. Show success message — email sent notification instead of auto-login
      setSuccessMsg('Account created! Please check your email for a confirmation link, then sign in.');
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object' && !err.response.data.message) {
        // Handle validation errors key-value map
        const validationErrs = Object.values(err.response.data).join(', ');
        setError(validationErrs || 'Registration failed.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{maxWidth: '400px', margin: '4rem auto'}}>
      <div className="glass-panel" style={{padding: '2.5rem'}}>
        <h2 style={{marginBottom: '0.5rem', textAlign: 'center'}}>Create an Account</h2>
        <p style={{color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem'}}>Join JobPortal today.</p>
        
        {error && <div style={{background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem'}}>{error}</div>}

        {successMsg && <div style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem'}}>{successMsg}</div>}
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Username</label>
            <input 
              type="text" 
              name="username"
              required
              value={formData.username} 
              onChange={handleChange} 
              placeholder="johndoe"
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email} 
              onChange={handleChange} 
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Password</label>
            <input 
              type="password"
              name="password" 
              required
              value={formData.password} 
              onChange={handleChange} 
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{marginTop: '1rem', width: '100%'}} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <div style={{textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem'}}>
          <span style={{color: 'var(--text-muted)'}}>Already have an account? </span>
          <Link to="/login" style={{fontWeight: '500'}}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
