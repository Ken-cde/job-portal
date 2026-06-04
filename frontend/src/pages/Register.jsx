import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PageTransition } from '../components/MotionSystem';
import GlassPanel from '../components/GlassPanel';
import CinematicText from '../components/CinematicText';
import { RippleButton } from '../components/MotionSystem';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'CANDIDATE'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/auth/register', formData);
      setSuccessMsg('Identity Created. Please confirm your signal via email.');
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object' && !err.response.data.message) {
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
    <PageTransition>
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <GlassPanel
          angle={-1}
          className="w-full max-w-md p-8 md:p-12 glow"
        >
          <div className="text-center mb-12">
            <CinematicText variant="h3" className="text-white text-2xl mb-2">New Identity</CinematicText>
            <p className="text-white/40 cinematic-text text-[10px] uppercase tracking-widest">Initialize User Protocol</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs cinematic-text text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs cinematic-text text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-3">
              <label className="text-white/60 cinematic-text text-[10px] uppercase ml-1">Account Type</label>
              <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'CANDIDATE' })}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-all rounded-lg ${formData.role === 'CANDIDATE' ? 'bg-p3cyan text-black font-bold shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'EMPLOYER' })}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-all rounded-lg ${formData.role === 'EMPLOYER' ? 'bg-p3cyan text-black font-bold shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  Employer
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/60 cinematic-text text-[10px] uppercase ml-1">Username</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="identity_name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-p3cyan/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/60 cinematic-text text-[10px] uppercase ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="identity@network.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-p3cyan/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/60 cinematic-text text-[10px] uppercase ml-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-p3cyan/50 transition-all"
              />
            </div>

            <RippleButton type="submit" className="w-full py-4" disabled={isLoading}>
              {isLoading ? 'Initializing...' : 'Create Identity'}
            </RippleButton>
          </form>

          <div className="text-center mt-12">
            <span className="text-white/40 cinematic-text text-[10px]">Existing Record? </span>
            <Link to="/login" className="text-p3cyan cinematic-text text-[10px] font-bold hover:underline">Sign In</Link>
          </div>
        </GlassPanel>
      </div>
    </PageTransition>
  );
};

export default Register;
