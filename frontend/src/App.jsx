import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AtmosphericBackground from './components/AtmosphericBackground';
import './App.css';

// Import our new pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-panel flex items-center justify-between px-4 py-4 mb-8 relative z-[100] gap-4 overflow-x-auto whitespace-nowrap">
      <div className="flex items-center gap-6">
        <Link to="/" style={{fontWeight: 'bold', fontSize: '1.2rem'}} className="shrink-0">🚀 JobPortal</Link>
        <Link to="/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">Dashboard</Link>
      </div>

      <div className="flex items-center gap-3 md:gap-6 shrink-0">
        {user ? (
          <>
            <Link to="/profile" style={{color: 'var(--text-muted)'}} className="text-xs">Profile</Link>
            <span style={{color: 'var(--text-muted)', fontSize: '12px'}}>Hi, {user.username} ({user.role})</span>
            <button onClick={logout} className="btn btn-secondary text-xs px-3 py-1">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary text-xs px-3 py-1">Login</Link>
            <Link to="/register" className="btn btn-primary text-xs px-3 py-1">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="relative min-h-screen w-full">
            <AtmosphericBackground />
            <Navbar />
            <main className="relative z-10 pt-12 md:pt-24 px-4 md:px-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
