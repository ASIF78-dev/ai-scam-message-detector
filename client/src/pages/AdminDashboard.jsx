import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  BarChart2,
  PieChart,
  Globe,
  FileText,
  Download,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  Lock,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserX,
  Database,
  Layers,
} from 'lucide-react';
import {
  getAdminAnalytics,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminScans,
  exportAdminReport,
  seedAdminDemoData,
  elevateDemoAdmin,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

// ==========================================
// 1. Custom SVG Trend Line Chart Component
// ==========================================
function TrendLineChart({ data = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
        No trend data available.
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(5, ...data.map((d) => Math.max(d.total, d.scam)));
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  const getX = (idx) => paddingLeft + (idx / Math.max(1, data.length - 1)) * chartW;
  const getY = (val) => paddingTop + chartH - (val / maxVal) * chartH;

  // Build SVG Path strings
  const totalPoints = data.map((d, i) => `${getX(i)},${getY(d.total)}`).join(' ');
  const scamPoints = data.map((d, i) => `${getX(i)},${getY(d.scam)}`).join(' ');

  const totalAreaPath = `M ${getX(0)},${getY(0)} ` +
    data.map((d, i) => `L ${getX(i)},${getY(d.total)}`).join(' ') +
    ` L ${getX(data.length - 1)},${getY(0)} Z`;

  return (
    <div className="trend-chart-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        aria-label="Scan volume and threat detection trend chart"
      >
        <defs>
          <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="scamLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {yTicks.map((val, i) => {
          const y = getY(val);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray={val === 0 ? 'none' : '3 3'}
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
                fontFamily="JetBrains Mono, monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Total Scans Area Fill */}
        <path d={totalAreaPath} fill="url(#totalAreaGrad)" />

        {/* Total Scans Line */}
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={totalPoints}
        />

        {/* Scam Detections Line */}
        <polyline
          fill="none"
          stroke="url(#scamLineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={scamPoints}
        />

        {/* Interactive Data Points */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cyTotal = getY(d.total);
          const cyScam = getY(d.scam);
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Vertical Guide Line when hovered */}
              {isHovered && (
                <line
                  x1={cx}
                  y1={paddingTop}
                  x2={cx}
                  y2={paddingTop + chartH}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
              )}

              {/* Total Point */}
              <circle
                cx={cx}
                cy={cyTotal}
                r={isHovered ? 5 : 3.5}
                fill="#38bdf8"
                stroke="#0b1120"
                strokeWidth="2"
              />

              {/* Scam Point */}
              <circle
                cx={cx}
                cy={cyScam}
                r={isHovered ? 5 : 3.5}
                fill="#f43f5e"
                stroke="#0b1120"
                strokeWidth="2"
              />

              {/* X-axis Date Labels (Skip every 2 for density) */}
              {(i % 2 === 0 || i === data.length - 1) && (
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="var(--text-muted)"
                >
                  {d.displayDate}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {data[hoveredIdx].date}
          </span>
          <span style={{ color: '#38bdf8' }}>
            Total: <strong>{data[hoveredIdx].total}</strong>
          </span>
          <span style={{ color: '#f43f5e' }}>
            Scams: <strong>{data[hoveredIdx].scam}</strong>
          </span>
          <span style={{ color: '#34d399' }}>
            Safe: <strong>{data[hoveredIdx].safe}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. Custom SVG Donut Chart Component
// ==========================================
function DonutChart({ segments = [], totalLabel = 'Total', centerValue = 0 }) {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const totalSum = segments.reduce((acc, s) => acc + (s.value || 0), 0) || 1;

  let currentOffset = 0;
  const renderedSegments = segments.map((seg) => {
    const fraction = (seg.value || 0) / totalSum;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += fraction * circumference;
    const percent = Math.round(fraction * 100);

    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
      percent,
    };
  });

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-svg-container">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {renderedSegments.map((seg, idx) => (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          ))}
        </svg>

        {/* Center Label */}
        <div className="donut-center-label">
          <div className="donut-center-num">{centerValue}</div>
          <div className="donut-center-sub">{totalLabel}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="donut-legend">
        {renderedSegments.map((seg, idx) => (
          <div key={idx} className="donut-legend-item">
            <div className="donut-legend-left">
              <span className="donut-legend-color" style={{ background: seg.color }} />
              <span>{seg.label}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seg.value}</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>({seg.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. Category Horizontal Bar Chart Component
// ==========================================
function CategoryBarChart({ categories = [] }) {
  if (!categories || categories.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No threat category data recorded yet.</p>;
  }

  const maxCount = Math.max(1, ...categories.map((c) => c.count));

  const getCategoryColor = (name) => {
    switch (name) {
      case 'phishing':
        return 'linear-gradient(90deg, #ef4444, #f43f5e)';
      case 'financial_scam':
        return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
      case 'lottery_prize_scam':
        return 'linear-gradient(90deg, #ec4899, #f472b6)';
      case 'job_scam':
        return 'linear-gradient(90deg, #a855f7, #c084fc)';
      case 'otp_theft':
        return 'linear-gradient(90deg, #dc2626, #ef4444)';
      case 'link_shared':
        return 'linear-gradient(90deg, #06b6d4, #38bdf8)';
      default:
        return 'linear-gradient(90deg, #38bdf8, #818cf8)';
    }
  };

  return (
    <div className="bar-chart-container">
      {categories.slice(0, 6).map((cat, idx) => {
        const pct = Math.round((cat.count / maxCount) * 100);
        return (
          <div key={idx} className="bar-row">
            <div className="bar-row-header">
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {cat.label || cat.category.replace(/_/g, ' ')}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                {cat.count} scans
              </span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${pct}%`,
                  background: getCategoryColor(cat.category),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// MAIN ADMIN DASHBOARD COMPONENT
// ==========================================
export default function AdminDashboard() {
  const { user, updateSession } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'overview' | 'users' | 'scans' | 'feedback' | 'export'
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [systemScans, setSystemScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [scanSearch, setScanSearch] = useState('');
  const [scanPredictionFilter, setScanPredictionFilter] = useState('');
  const [scanRiskFilter, setScanRiskFilter] = useState('');
  const [daysRange, setDaysRange] = useState(14);

  // Pagination
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [scansPage, setScansPage] = useState(1);
  const [scansTotalPages, setScansTotalPages] = useState(1);

  // Load Analytics Data
  const fetchAnalytics = async (days = daysRange) => {
    try {
      setError('');
      const data = await getAdminAnalytics(days);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      setError(err.response?.data?.message || 'Failed to load threat intelligence analytics.');
    }
  };

  // Load Users Data
  const fetchUsers = async (page = 1, search = userSearch) => {
    try {
      const data = await getAdminUsers(page, 15, search);
      setUsersList(data.users || []);
      setUsersPage(data.pagination?.page || 1);
      setUsersTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // Load System Scans Data
  const fetchScans = async (page = 1) => {
    try {
      const filters = {};
      if (scanSearch) filters.search = scanSearch;
      if (scanPredictionFilter) filters.prediction = scanPredictionFilter;
      if (scanRiskFilter) filters.riskLevel = scanRiskFilter;

      const data = await getAdminScans(page, 20, filters);
      setSystemScans(data.scans || []);
      setScansPage(data.pagination?.page || 1);
      setScansTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load system scans:', err);
    }
  };

  // Initial Load & Auth Check
  useEffect(() => {
    if (user?.role === 'admin') {
      setLoading(true);
      Promise.all([fetchAnalytics(daysRange), fetchUsers(1, ''), fetchScans(1)])
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, daysRange]);

  // Handle Promoting Self to Admin for Testing
  const handleElevateSelf = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await elevateDemoAdmin();
      updateSession(res.token, res.user);
      setSuccessMsg('Account upgraded to Admin! Loading dashboard...');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to elevate account privileges.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Seed Demo Data
  const handleSeedDemoData = async () => {
    if (!window.confirm('Populate database with 45 realistic scans spanning 14 days for demonstration?')) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await seedAdminDemoData();
      setSuccessMsg(res.message);
      await Promise.all([fetchAnalytics(daysRange), fetchScans(1)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to seed demo data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Role Toggle
  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change user role to ${newRole.toUpperCase()}?`)) return;

    try {
      await updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      setSuccessMsg(`User role updated to ${newRole}.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user account? This cannot be undone.')) return;

    try {
      await deleteUser(userId);
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
      setSuccessMsg('User account removed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Handle Report Export
  const handleExportJSON = async () => {
    try {
      const report = await exportAdminReport();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `scamshield_threat_report_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccessMsg('Threat report exported successfully.');
    } catch (err) {
      alert('Failed to generate export report.');
    }
  };

  // Handle CSV Export
  const handleExportCSV = async () => {
    try {
      const report = await exportAdminReport();
      if (!report.scans || report.scans.length === 0) {
        alert('No scan records available to export.');
        return;
      }

      const headers = ['ID', 'Date', 'Prediction', 'RiskScore', 'RiskLevel', 'Category', 'URLs', 'Message'];
      const rows = report.scans.map((s) => [
        s.id,
        `"${s.date}"`,
        s.prediction,
        s.riskScore,
        s.riskLevel,
        s.category || 'other',
        `"${(s.urls || []).join('; ')}"`,
        `"${(s.messageSnippet || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `scamshield_scans_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMsg('CSV records exported successfully.');
    } catch (err) {
      alert('Failed to generate CSV export.');
    }
  };

  // Non-Admin Screen Guard
  if (!user || user.role !== 'admin') {
    return (
      <section className="history-section">
        <div className="empty-card" style={{ maxWidth: '640px', margin: '40px auto' }}>
          <div className="empty-icon-wrap" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
            <Lock size={36} />
          </div>
          <h2>Admin Privileges Required</h2>
          <p>
            The ScamShield AI Admin Console & Threat Intelligence Suite is restricted to administrative staff.
          </p>

          {user ? (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                You are signed in as <strong>{user.name}</strong> (<code>{user.email}</code>) with role: <code>{user.role}</code>.
              </div>

              <button
                type="button"
                onClick={handleElevateSelf}
                disabled={actionLoading}
                className="button"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none' }}
              >
                <Sparkles size={16} />
                <span>{actionLoading ? 'Elevating Account...' : 'Elevate This Account to Admin (Dev Mode)'}</span>
              </button>
            </div>
          ) : (
            <div className="empty-actions" style={{ marginTop: '16px' }}>
              <Link to="/login" className="button">
                <span>Sign In as Administrator</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  const summary = analytics?.summary || {
    totalScans: 0,
    scamCount: 0,
    safeCount: 0,
    suspiciousCount: 0,
    totalUsers: 0,
    totalFeedback: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
  };

  const scamVsSafeSegments = [
    { label: 'Scam', value: summary.scamCount, color: '#f43f5e' },
    { label: 'Suspicious', value: summary.suspiciousCount, color: '#f59e0b' },
    { label: 'Safe', value: summary.safeCount, color: '#10b981' },
  ];

  return (
    <div className="admin-dashboard-page" style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Header & Fast Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', padding: '8px', borderRadius: '10px', color: '#0f172a' }}>
              <Shield size={22} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              ScamShield Admin
            </h1>
            <span className="role-badge admin" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
              SEC-OPS LEVEL 1
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Centralized Threat Intelligence, Heuristic Machine Learning Analytics & User Administration.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {summary.totalScans < 5 && (
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={actionLoading}
              className="button-secondary"
              style={{ borderColor: '#a855f7', color: '#c084fc' }}
              title="Populate 45 sample scans across 14 days"
            >
              <Sparkles size={15} />
              <span>Seed Demo Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              Promise.all([fetchAnalytics(daysRange), fetchUsers(usersPage), fetchScans(scansPage)])
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="button-secondary"
            title="Refresh All Admin Metrics"
          >
            <RefreshCw size={15} className={loading ? 'radar-spinner' : ''} style={{ width: 15, height: 15, borderWidth: 2 }} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="button"
            title="Download full JSON threat audit log"
          >
            <Download size={15} />
            <span>Export Intel</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error && <div className="error-banner">{error}</div>}
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '12px 18px', borderRadius: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4️⃣ WIREFRAME EXACT 3-COLUMN STAT TRIO HERO                */}
      {/* ┌─────────────────────────────────────┐                  */}
      {/* │          ScamShield Admin           │                  */}
      {/* ├──────────┬──────────┬───────────────┤                  */}
      {/* │  1,250   │   730    │     520       │                  */}
      {/* │  Scans   │  Scams   │     Safe      │                  */}
      {/* └─────────────────────────────────────┘                  */}
      {/* ========================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(56, 189, 248, 0.2)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(11, 17, 32, 0.95))', padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              ScamShield Admin • Global Telemetry
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Last <strong>{daysRange} days</strong> aggregation window
          </span>
        </div>

        <div className="admin-stat-trio">
          {/* Box 1: Total Scans */}
          <div className="admin-trio-card">
            <div className="admin-trio-num" style={{ color: '#38bdf8' }}>
              {summary.totalScans.toLocaleString()}
            </div>
            <div className="admin-trio-label">
              Scans
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Total messages analyzed
            </span>
          </div>

          {/* Box 2: Scams Detected */}
          <div className="admin-trio-card">
            <div className="admin-trio-num" style={{ color: '#f43f5e' }}>
              {summary.scamCount.toLocaleString()}
            </div>
            <div className="admin-trio-label" style={{ color: '#f43f5e' }}>
              Scams
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {summary.totalScans > 0 ? Math.round((summary.scamCount / summary.totalScans) * 100) : 0}% of all traffic
            </span>
          </div>

          {/* Box 3: Safe Messages */}
          <div className="admin-trio-card">
            <div className="admin-trio-num" style={{ color: '#34d399' }}>
              {summary.safeCount.toLocaleString()}
            </div>
            <div className="admin-trio-label" style={{ color: '#34d399' }}>
              Safe
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {summary.totalScans > 0 ? Math.round((summary.safeCount / summary.totalScans) * 100) : 0}% benign baseline
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="admin-tabs-nav">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <BarChart2 size={16} />
          <span>Analytics & Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          <Users size={16} />
          <span>User Management ({summary.totalUsers})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scans')}
          className={`admin-tab-btn ${activeTab === 'scans' ? 'active' : ''}`}
        >
          <Search size={16} />
          <span>System Scans ({summary.totalScans})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`admin-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
        >
          <MessageSquare size={16} />
          <span>Feedback Review ({summary.totalFeedback})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`admin-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
        >
          <Download size={16} />
          <span>Export & Reports</span>
        </button>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="loading-container" style={{ padding: '60px 0' }}>
          <div className="radar-spinner" style={{ width: 44, height: 44 }} />
          <p>Compiling administrator threat intelligence...</p>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: ANALYTICS & OVERVIEW                                */}
      {/* ========================================================= */}
      {!loading && activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main 2-Column Grid: Trend Line Chart & Scam vs Safe Donut */}
          <div className="chart-grid-2">
            
            {/* Chart Card 1: Line Trend Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">
                  <TrendingUp size={18} color="#38bdf8" />
                  <span>Daily Scan & Threat Trends</span>
                </div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 10, height: 3, background: '#38bdf8', borderRadius: 2 }} />
                    Total Scans
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 10, height: 3, background: '#f43f5e', borderRadius: 2 }} />
                    Scams
                  </span>
                </div>
              </div>

              <TrendLineChart data={analytics?.dailyTrends || []} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '4px' }}>
                <span>Past {daysRange} days continuous monitoring</span>
                <span>Peak Scans: {Math.max(0, ...(analytics?.dailyTrends || []).map((t) => t.total))} in 24h</span>
              </div>
            </div>

            {/* Chart Card 2: Scam vs Safe Donut */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">
                  <PieChart size={18} color="#a855f7" />
                  <span>Scam vs. Safe Classification</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Model Verdict Ratio
                </span>
              </div>

              <DonutChart
                segments={scamVsSafeSegments}
                totalLabel="Scans"
                centerValue={summary.totalScans}
              />

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e' }}>{summary.scamCount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Confirmed Scam</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>{summary.suspiciousCount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Suspicious</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{summary.safeCount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Normal</div>
                </div>
              </div>
            </div>

          </div>

          {/* Secondary 2-Column Grid: Scam Categories & Risk/URL Analytics */}
          <div className="chart-grid-2">
            
            {/* Chart Card 3: Scam Category Distribution */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">
                  <Layers size={18} color="#f59e0b" />
                  <span>Scam Category Distribution</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Threat taxonomy breakdown
                </span>
              </div>

              <CategoryBarChart categories={analytics?.categoryDistribution || []} />
            </div>

            {/* Chart Card 4: URL Intelligence & Model Feedback Accuracy */}
            <div className="chart-card" style={{ gap: '20px' }}>
              <div className="chart-card-header">
                <div className="chart-card-title">
                  <Globe size={18} color="#06b6d4" />
                  <span>URL Threat Detection & Feedback</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Deep Link Analysis
                </span>
              </div>

              {/* URL Stats Subgrid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Messages with URLs
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                    {analytics?.urlStatistics?.scansWithUrls || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Total URLs: {analytics?.urlStatistics?.totalUrls || 0}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Malicious URLs
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
                    {analytics?.urlStatistics?.dangerousUrls || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Suspicious: {analytics?.urlStatistics?.suspiciousUrls || 0}
                  </div>
                </div>
              </div>

              {/* Feedback Accuracy Ribbon */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Model Feedback Accuracy
                    </span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Based on {analytics?.feedbackAccuracy?.totalReviews || 0} verified user reviews
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                    {analytics?.feedbackAccuracy?.accuracyRate ?? 100}%
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#fb7185' }}>
                    {analytics?.feedbackAccuracy?.wrongCount || 0} Disagreements
                  </span>
                </div>
              </div>

              {/* Risk Level Horizontal Meter */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Risk Distribution (HIGH / MEDIUM / LOW)</span>
                  <span>{summary.highRiskCount} H / {summary.mediumRiskCount} M / {summary.lowRiskCount} L</span>
                </div>
                <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ width: `${summary.totalScans ? (summary.highRiskCount / summary.totalScans) * 100 : 0}%`, background: '#ef4444' }} title="HIGH" />
                  <div style={{ width: `${summary.totalScans ? (summary.mediumRiskCount / summary.totalScans) * 100 : 0}%`, background: '#f59e0b' }} title="MEDIUM" />
                  <div style={{ width: `${summary.totalScans ? (summary.lowRiskCount / summary.totalScans) * 100 : 0}%`, background: '#10b981' }} title="LOW" />
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================= */}
          {/* Wireframe Bottom Section: Recent Scans / Feedback         */}
          {/* ========================================================= */}
          <div className="chart-grid-2">
            
            {/* Recent Scans Box */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">
                  <Search size={17} color="#38bdf8" />
                  <span>Recent System Scans</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('scans')}
                  className="button-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(analytics?.recentScans || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No recent scans recorded.</p>
                ) : (
                  (analytics?.recentScans || []).map((scan) => (
                    <div
                      key={scan._id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          className={`badge ${
                            scan.riskLevel === 'HIGH' ? 'badge-high' : scan.riskLevel === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                          }`}
                          style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                        >
                          {(scan.prediction || 'normal').toUpperCase()} ({scan.riskScore}%)
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{scan.message}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Feedback Box */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">
                  <MessageSquare size={17} color="#34d399" />
                  <span>Recent User Feedback</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('feedback')}
                  className="button-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  Manage
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(analytics?.recentFeedback || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No user feedback submitted yet.</p>
                ) : (
                  (analytics?.recentFeedback || []).map((fb) => (
                    <div
                      key={fb._id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: fb.isCorrect ? '#34d399' : '#fb7185',
                          }}
                        >
                          {fb.isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {fb.isCorrect ? 'USER CONFIRMED' : 'USER DISAGREED'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(fb.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{fb.message}"
                      </p>
                      {fb.comment && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Note: {fb.comment}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USER MANAGEMENT                                    */}
      {/* ========================================================= */}
      {!loading && activeTab === 'users' && (
        <div className="chart-card" style={{ gap: '20px' }}>
          <div className="chart-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="chart-card-title">
                <Users size={20} color="#38bdf8" />
                <span>User Account Administration</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Inspect registered users, manage administrative roles, and inspect scan usage quotas.
              </p>
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    fetchUsers(1, e.target.value);
                  }}
                  style={{
                    padding: '8px 12px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    minWidth: '240px',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Scans Performed</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No registered users found matching your search.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800 }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span>{u.name}</span>
                          {u._id === user?.id && (
                            <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>YOU</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <strong>{u.scanCount || 0}</strong> scans
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleRoleToggle(u._id, u.role)}
                            disabled={u._id === user?.id}
                            className="button-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            title={u.role === 'admin' ? 'Demote to regular user' : 'Promote to administrator'}
                          >
                            {u.role === 'admin' ? <UserX size={13} /> : <UserCheck size={13} />}
                            <span>{u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u._id === user?.id}
                            className="delete-btn"
                            style={{ padding: '4px 8px' }}
                            title="Delete user account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {usersTotalPages > 1 && (
            <div className="pagination">
              <button
                className="button-secondary"
                disabled={usersPage <= 1}
                onClick={() => fetchUsers(usersPage - 1, userSearch)}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {usersPage} of {usersTotalPages}
              </span>
              <button
                className="button-secondary"
                disabled={usersPage >= usersTotalPages}
                onClick={() => fetchUsers(usersPage + 1, userSearch)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SYSTEM SCANS HISTORY                               */}
      {/* ========================================================= */}
      {!loading && activeTab === 'scans' && (
        <div className="chart-card" style={{ gap: '20px' }}>
          <div className="chart-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="chart-card-title">
                <Search size={20} color="#38bdf8" />
                <span>Global System Scan Registry</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                System-wide audit trail of all messages processed by ScamShield AI across all users.
              </p>
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search scanned message text..."
                value={scanSearch}
                onChange={(e) => setScanSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchScans(1)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  minWidth: '220px',
                }}
              />

              <select
                value={scanPredictionFilter}
                onChange={(e) => {
                  setScanPredictionFilter(e.target.value);
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                }}
              >
                <option value="">All Verdicts</option>
                <option value="scam">Scam Only</option>
                <option value="suspicious">Suspicious Only</option>
                <option value="normal">Safe Only</option>
              </select>

              <select
                value={scanRiskFilter}
                onChange={(e) => {
                  setScanRiskFilter(e.target.value);
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                }}
              >
                <option value="">All Risk Levels</option>
                <option value="HIGH">HIGH Risk</option>
                <option value="MEDIUM">MEDIUM Risk</option>
                <option value="LOW">LOW Risk</option>
              </select>

              <button
                type="button"
                onClick={() => fetchScans(1)}
                className="button-secondary"
                style={{ padding: '7px 12px' }}
              >
                <Filter size={14} />
                <span>Filter</span>
              </button>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Verdict</th>
                  <th>Risk Score</th>
                  <th>Category</th>
                  <th>Message Content</th>
                  <th>Extracted URLs</th>
                  <th>User</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {systemScans.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No scan records match your filter parameters.
                    </td>
                  </tr>
                ) : (
                  systemScans.map((scan) => (
                    <tr key={scan._id}>
                      <td>
                        <span
                          className={`badge ${
                            scan.riskLevel === 'HIGH' ? 'badge-high' : scan.riskLevel === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                          }`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {(scan.prediction || 'normal').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: scan.riskScore >= 70 ? '#f43f5e' : scan.riskScore >= 40 ? '#f59e0b' : '#34d399' }}>
                          {scan.riskScore}%
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontSize: '0.78rem' }}>
                        {scan.category ? scan.category.replace(/_/g, ' ') : 'normal'}
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }} title={scan.message}>
                          "{scan.message}"
                        </div>
                      </td>
                      <td style={{ fontSize: '0.76rem' }}>
                        {(scan.extractedUrls && scan.extractedUrls.length > 0) ? (
                          <span style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                            {scan.extractedUrls.length} URL ({scan.urlRiskScore || 0}% risk)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {scan.userId ? scan.userId.name : 'Anonymous'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(scan.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {scansTotalPages > 1 && (
            <div className="pagination">
              <button
                className="button-secondary"
                disabled={scansPage <= 1}
                onClick={() => fetchScans(scansPage - 1)}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {scansPage} of {scansTotalPages}
              </span>
              <button
                className="button-secondary"
                disabled={scansPage >= scansTotalPages}
                onClick={() => fetchScans(scansPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FEEDBACK REVIEW (Directly Integrated)              */}
      {/* ========================================================= */}
      {!loading && activeTab === 'feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="chart-card" style={{ gap: '16px' }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">
                  <MessageSquare size={20} color="#34d399" />
                  <span>Model Prediction Feedback & User Verification</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Inspect real-world human-in-the-loop ratings, flagged false positives, and dataset training samples.
                </p>
              </div>

              <Link to="/admin/feedback" className="button-secondary" style={{ fontSize: '0.8rem' }}>
                <span>Dedicated Curation Console</span>
                <ExternalLink size={14} />
              </Link>
            </div>

            {/* Quick stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Feedback</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{analytics?.feedbackAccuracy?.totalReviews || 0}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accuracy Rate</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{analytics?.feedbackAccuracy?.accuracyRate ?? 100}%</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirmed Correct</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{analytics?.feedbackAccuracy?.correctCount || 0}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User Corrections</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185' }}>{analytics?.feedbackAccuracy?.wrongCount || 0}</div>
              </div>
            </div>

            {/* Feedback items table */}
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Review</th>
                    <th>Predicted Label</th>
                    <th>User Suggestion</th>
                    <th>Message</th>
                    <th>User Note</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.recentFeedback || []).length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No feedback records submitted yet. Use the Scanner to test predictions and submit feedback!
                      </td>
                    </tr>
                  ) : (
                    (analytics?.recentFeedback || []).map((item) => (
                      <tr key={item._id}>
                        <td>
                          {item.isCorrect ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>
                              <CheckCircle2 size={14} /> Confirmed Correct
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#fb7185', fontWeight: 700, fontSize: '0.75rem' }}>
                              <XCircle size={14} /> Flagged Wrong
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="category-pill" style={{ fontSize: '0.72rem' }}>
                            {(item.predictedLabel || '').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {item.userCorrection ? (
                            <span className="category-pill" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.72rem' }}>
                              {(item.userCorrection).toUpperCase()}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            "{item.message}"
                          </div>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {item.comment || '—'}
                        </td>
                        <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: EXPORT & REPORTS                                   */}
      {/* ========================================================= */}
      {!loading && activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          
          <div className="chart-card">
            <div className="chart-card-title">
              <FileText size={18} color="#38bdf8" />
              <span>Full Threat Intelligence Audit (JSON)</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Export complete structured JSON dataset containing recent system scans, URL threat vectors,
              heuristic pattern triggers, and human feedback records for offline security auditing or machine learning retraining.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={handleExportJSON}
                className="button"
                style={{ width: '100%' }}
              >
                <Download size={16} />
                <span>Download Executive JSON Audit</span>
              </button>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-title">
              <Database size={18} color="#10b981" />
              <span>Scan Telemetry Spreadsheets (CSV)</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Export scan logs in standard comma-separated values (CSV) format compatible with Excel, Google Sheets,
              and enterprise Business Intelligence (BI) dashboards.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={handleExportCSV}
                className="button-secondary"
                style={{ width: '100%', borderColor: '#10b981', color: '#34d399' }}
              >
                <Download size={16} />
                <span>Download Scan Registry CSV</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
