import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { PageTransition } from '../components/MotionSystem';
import GlassPanel from '../components/GlassPanel';
import CinematicText from '../components/CinematicText';
import { RippleButton } from '../components/MotionSystem';

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
      if (!err.response) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        const msg = err.response?.data?.message || err.response?.data || 'Invalid credentials. Please try again.';
        setError(typeof msg === 'string' ? msg : 'Invalid credentials. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <GlassPanel
          angle={1}
          className="w-full max-w-md p-12 glow"
        >
          <div className="text-center mb-12">
            <CinematicText variant="h3" className="text-white text-2xl mb-2">Authentication</CinematicText>
            <p className="text-white/40 cinematic-text text-[10px] uppercase tracking-widest">Neural Link Required</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs cinematic-text text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-white/60 cinematic-text text-[10px] uppercase ml-1">Identity Signal (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="identity@network.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-p3cyan/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/60 cinematic-text text-[10px] uppercase ml-1">Access Key (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-p3cyan/50 transition-all"
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-white/30 cinematic-text text-[10px] hover:text-p3cyan transition-colors">Reset Signal</Link>
            </div>

            <RippleButton type="submit" className="w-full py-4" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Initialize Link'}
            </RippleButton>
          </form>

          <div className="text-center mt-12">
            <span className="text-white/40 cinematic-text text-[10px]">No neural record? </span>
            <Link to="/register" className="text-p3cyan cinematic-text text-[10px] font-bold hover:underline">Create Identity</Link>
          </div>
        </GlassPanel>
      </div>
    </PageTransition>
  );
};

export default Login;
