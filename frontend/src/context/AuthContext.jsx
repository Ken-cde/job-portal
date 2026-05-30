import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const warmUp = async () => {
      try {
        await api.get('/health');
      } catch (err) {
        console.log('Warm-up failed or server is already awake');
      }
    };

    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    warmUp();
    fetchUser();
  }, []);

  const login = async (email, password, retries = 1) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      // Fetch profile
      const profileRes = await api.get('/users/me');
      setUser(profileRes.data);
      return profileRes.data;
    } catch (err) {
      // Retry if it's a network error or a 5xx server error (common during cold starts)
      if (retries > 0 && (!err.response || (err.response.status >= 500 && err.response.status <= 599))) {
        console.log(`Login attempt failed, retrying... (${retries} attempts left)`);
        return login(email, password, retries - 1);
      }
      throw err;
    }
  };

  const register = async (username, email, password) => {
    await api.post('/auth/register', { username, email, password });
    // Auto login optionally, or just redirect
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
