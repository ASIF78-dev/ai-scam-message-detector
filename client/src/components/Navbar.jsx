import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, ScanLine, History, LogOut, User, Sparkles, Sun, Moon, MessageSquare, BarChart2 } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" className="brand">
          <div className="brand-icon-wrap">
            <Shield size={22} strokeWidth={2.4} />
          </div>
          <span className="brand-text">ScamShield AI</span>
        </Link>
        <div className="nav-status-badge">
          <span className="pulse-dot" />
          <span>AI Engine Online</span>
        </div>
      </div>

      <nav className="nav-links">
        <Link
          to="/scanner"
          className={`nav-link ${isActive('/scanner') ? 'active' : ''}`}
        >
          <ScanLine size={17} />
          <span>Scanner</span>
        </Link>

        <Link
          to="/history"
          className={`nav-link ${isActive('/history') ? 'active' : ''}`}
        >
          <History size={17} />
          <span>History</span>
        </Link>

        {user && (
          <Link
            to="/admin"
            className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
            title="Enterprise Threat Intelligence & Admin Console"
          >
            <BarChart2 size={17} />
            <span>Admin</span>
          </Link>
        )}

        {user?.role === 'admin' && (
          <Link
            to="/admin/feedback"
            className={`nav-link ${isActive('/admin/feedback') ? 'active' : ''}`}
            title="Model Feedback Curation Console"
          >
            <MessageSquare size={17} />
            <span>Feedback</span>
          </Link>
        )}


        {/* Light / Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Switch between light and dark mode"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="theme-icon sun-icon" />
          ) : (
            <Moon size={18} className="theme-icon moon-icon" />
          )}
        </button>

        {user ? (
          <div className="user-menu">
            <div className="user-badge" title={user.email}>
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
              <span className="user-name">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Sign out of your account">
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="login-link">
              Sign In
            </Link>
            <Link to="/register" className="register-btn">
              <Sparkles size={15} />
              <span>Get Started</span>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

