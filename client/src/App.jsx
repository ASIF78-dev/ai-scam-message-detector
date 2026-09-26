import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminFeedback from './pages/AdminFeedback';
import AdminDashboard from './pages/AdminDashboard';
import { Shield } from 'lucide-react';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/history" element={<History />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-left">
              <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#38bdf8" />
                <span>ScamShield AI</span>
              </div>
              <span className="footer-copy">
                © {new Date().getFullYear()} ScamShield AI — Hybrid ML & Rule-Based Threat Detection.
              </span>
            </div>

            <div className="footer-tags">
              <span className="footer-tag">TF-IDF Vectorizer</span>
              <span className="footer-tag">Logistic Regression</span>
              <span className="footer-tag">FastAPI Heuristics</span>
              <span className="footer-tag">React + Vite</span>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
    </ThemeProvider>
  );
}


