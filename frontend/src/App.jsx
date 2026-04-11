import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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
    <nav className="glass-panel" style={{padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative', zIndex: 100}}>
      <Link to="/" style={{fontWeight: 'bold', fontSize: '1.2rem'}}>🚀 JobPortal</Link>
      <Link to="/dashboard">Dashboard</Link>
      
      <div style={{marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center'}}>
        {user ? (
          <>
            <Link to="/profile" style={{color: 'var(--text-muted)'}}>Profile</Link>
            <span style={{color: 'var(--text-muted)'}}>Hi, {user.username} ({user.role})</span>
            <button onClick={logout} className="btn btn-secondary" style={{padding: '0.5rem 1rem'}}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
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
          <div className="app-container">
            <Navbar />
            <main className="main-content">
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
