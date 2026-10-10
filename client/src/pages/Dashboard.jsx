import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Activity,
  Server,
  Shield,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Zap,
  Globe,
  Lock,
  Network,
  Heart,
  Type,
  AlertCircle,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateMonitorModal from '../components/CreateMonitorModal';
import ResponseTimeChart from '../components/ResponseTimeChart';
import AuthModal from '../components/AuthModal';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour}h ago`;
};

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [analyticsMap, setAnalyticsMap] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [pingSuccessId, setPingSuccessId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Sign out and redirect to home
  const handleLogout = () => {
    logout();
    setMonitors([]);
    setExpandedRow(null);
    setAnalyticsMap({});
    navigate('/');
  };

  // Fetch all user monitors
  const fetchMonitors = useCallback(async (isManual = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (isManual) setRefreshing(true);
    setActionError(null);

    try {
      const res = await api.get('/monitors');
      setMonitors(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch monitors:', err);
      if (err.response?.status === 401) {
        setIsAuthModalOpen(true);
      } else {
        setActionError('Failed to synchronize monitors with server.');
      }
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [isAuthenticated]);

  // Fetch telemetry analytics for a specific monitor
  const fetchAnalytics = useCallback(async (id, showSpinner = false) => {
    if (!id || !isAuthenticated) return;
    if (showSpinner) {
      setAnalyticsLoading((prev) => ({ ...prev, [id]: true }));
    }
    try {
      const res = await api.get(`/analytics/${id}`);
      setAnalyticsMap((prev) => ({ ...prev, [id]: res.data.data }));
    } catch (err) {
      console.warn(`Failed to fetch analytics for monitor ${id}:`, err);
    } finally {
      if (showSpinner) {
        setAnalyticsLoading((prev) => ({ ...prev, [id]: false }));
      }
    }
  }, [isAuthenticated]);

  // Periodic refresh for monitors list (every 10 seconds)
  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(() => {
      if (isAuthenticated) fetchMonitors();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMonitors, isAuthenticated]);

  // Real-time telemetry auto-polling for currently expanded monitor (every 4 seconds)
  useEffect(() => {
    if (!expandedRow || !isAuthenticated) return;

    // Immediately fetch fresh data upon opening
    fetchAnalytics(expandedRow, !analyticsMap[expandedRow]);

    const pollInterval = setInterval(() => {
      fetchAnalytics(expandedRow, false);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [expandedRow, isAuthenticated, fetchAnalytics]);

  // Toggle row expansion
  const handleToggleRow = (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(id);
  };

  // Create monitor handler
  const handleCreateMonitor = async (data) => {
    setSubmitting(true);
    setActionError(null);
    try {
      await api.post('/monitors', data);
      setIsCreateModalOpen(false);
      await fetchMonitors();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create monitor');
    } finally {
      setSubmitting(false);
    }
  };

  // Pause or Resume monitor
  const handleToggleStatus = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/monitors/${id}/toggle-status`);
      await fetchMonitors();
    } catch (err) {
      console.error('Failed to toggle monitor status:', err);
    }
  };

  // Delete monitor
  const handleDeleteMonitor = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this monitor?')) return;
    try {
      await api.delete(`/monitors/${id}`);
      if (expandedRow === id) setExpandedRow(null);
      await fetchMonitors();
    } catch (err) {
      console.error('Failed to delete monitor:', err);
    }
  };

  // Compute heartbeat ping endpoint dynamically
  const getPingUrl = (id) => {
    const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;
    return `${apiBase}/monitors/${id}/ping`;
  };

  // Copy heartbeat URL
  const handleCopyPingUrl = (e, id) => {
    e.stopPropagation();
    const url = getPingUrl(id);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Trigger test ping for heartbeat monitor
  const handleTestPing = async (e, id) => {
    e.stopPropagation();
    try {
      await api.post(`/monitors/${id}/ping`);
      setPingSuccessId(id);
      setTimeout(() => setPingSuccessId(null), 3000);
      await fetchMonitors();
      await fetchAnalytics(id, false);
    } catch (err) {
      console.error('Heartbeat test ping failed:', err);
    }
  };

  // Manual trigger for instant sync
  const handleManualSync = async () => {
    await fetchMonitors(true);
    if (expandedRow) {
      await fetchAnalytics(expandedRow, true);
    }
  };

  const operationalCount = monitors.filter((m) => m.status === 'UP').length;
  const outageCount = monitors.filter((m) => m.status === 'DOWN').length;
  const pausedCount = monitors.filter((m) => m.status === 'PAUSED').length;

  const publicCompanySlug = user?.companyName
    ? encodeURIComponent(user.companyName)
    : user?.id || 'acme';

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HTTP': return <Globe size={14} className="text-blue-400" />;
      case 'KEYWORD': return <Type size={14} className="text-amber-400" />;
      case 'SSL': return <Lock size={14} className="text-emerald-400" />;
      case 'TCP': return <Network size={14} className="text-purple-400" />;
      case 'HEARTBEAT': return <Heart size={14} className="text-rose-400" />;
      default: return <Server size={14} />;
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-[#0B0F19] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Top Bar */}
      <div className="border-b border-slate-800 bg-[#0F1524]/80 backdrop-blur-md sticky top-0 z-30 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 text-base sm:text-lg font-bold text-white hover:opacity-90 transition">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                <Activity size={18} className="text-white" />
              </div>
              <span className="truncate">Pulse<span className="text-blue-400">Guard</span></span>
            </Link>
            <span className="hidden md:inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              NOC MISSION CONTROL
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSync}
              disabled={refreshing}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Sync Status Now"
            >
              <RefreshCw size={17} className={refreshing ? 'animate-spin text-blue-400' : ''} />
            </button>

            <Link
              to={`/status/${publicCompanySlug}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <ExternalLink size={14} /> Public Status Page
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{user?.companyName || 'Operator'}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut size={17} />
                <span className="text-xs font-medium hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {actionError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="p-1 hover:text-white rounded transition text-rose-400 hover:bg-rose-500/20"
              title="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Infrastructure Monitors
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Active distributed checks with zero-false-positive 3-retry verification.
            </p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setIsAuthModalOpen(true);
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5"
          >
            <Plus size={18} /> Add New Monitor
          </button>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                <Activity size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 truncate">Operational</p>
                <p className="text-xl sm:text-2xl font-extrabold text-[#39FF14] mt-0.5">{operationalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="p-2.5 sm:p-3 bg-rose-500/10 rounded-xl text-rose-400 shrink-0">
                <Server size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 truncate">Outages</p>
                <p className="text-xl sm:text-2xl font-extrabold text-[#FF3131] mt-0.5">{outageCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                <Pause size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 truncate">Paused</p>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-0.5">{pausedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
                <Shield size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 truncate">Monitored</p>
                <p className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">{monitors.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monitors Table */}
        <div className="w-full bg-[#131b2e] rounded-xl sm:rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm text-slate-300">
              <thead className="bg-[#0B0F19]/80 border-b border-slate-800 text-slate-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Monitor Name</th>
                  <th className="px-6 py-4">Protocol / Type</th>
                  <th className="px-6 py-4">Endpoint / Config</th>
                  <th className="px-6 py-4">Interval</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin text-blue-500" />
                        <span>Loading active monitors...</span>
                      </div>
                    </td>
                  </tr>
                ) : monitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="max-w-sm mx-auto">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Activity size={24} />
                        </div>
                        <p className="font-semibold text-white mb-1">No monitors created yet</p>
                        <p className="text-xs text-slate-400 mb-5">
                          Create your first HTTP, Keyword, SSL, TCP, or Heartbeat check to begin real-time monitoring.
                        </p>
                        <button
                          onClick={() => {
                            if (!isAuthenticated) setIsAuthModalOpen(true);
                            else setIsCreateModalOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                        >
                          + Create First Monitor
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  monitors.map((m) => {
                    const isExpanded = expandedRow === m._id;
                    const analytics = analyticsMap[m._id];
                    const isAnalyticsLoading = analyticsLoading[m._id];

                    return (
                      <React.Fragment key={m._id}>
                        <tr
                          onClick={() => handleToggleRow(m._id)}
                          className="hover:bg-slate-800/40 transition cursor-pointer select-none"
                        >
                          {/* Status Badge */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-3 h-3 rounded-full shrink-0 ${m.status === 'UP'
                                  ? 'bg-[#39FF14] shadow-[0_0_10px_#39FF14]'
                                  : m.status === 'DOWN'
                                    ? 'bg-[#FF3131] shadow-[0_0_10px_#FF3131]'
                                    : 'bg-slate-500'
                                  }`}
                              />
                              <span className="font-bold text-xs tracking-wide">
                                {m.status === 'UP' ? (
                                  <span className="text-[#39FF14]">OPERATIONAL</span>
                                ) : m.status === 'DOWN' ? (
                                  <span className="text-[#FF3131]">OUTAGE</span>
                                ) : (
                                  <span className="text-slate-400">PAUSED</span>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Monitor Name */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{m.name}</span>
                              {m.isPublic && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">
                                  PUBLIC
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Protocol / Type */}
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F19] text-xs font-medium border border-slate-800">
                              {getTypeIcon(m.type)}
                              <span>{m.type}</span>
                            </div>
                          </td>

                          {/* Target Details */}
                          <td className="px-6 py-4 font-mono text-xs text-slate-300">
                            {m.type === 'HEARTBEAT' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Cron Ping URL</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyPingUrl(e, m._id)}
                                  className="p-1 text-slate-400 hover:text-blue-400 rounded transition"
                                  title="Copy Heartbeat Ping URL"
                                >
                                  {copiedId === m._id ? (
                                    <Check size={14} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleTestPing(e, m._id)}
                                  className="text-[10px] px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/40 rounded transition"
                                  title="Send Test Ping to this Heartbeat"
                                >
                                  {pingSuccessId === m._id ? '✓ Pinged!' : '⚡ Test Ping'}
                                </button>
                              </div>
                            ) : (
                              <span>
                                {m.target}
                                {m.port ? `:${m.port}` : ''}
                                {m.keyword ? ` [match: "${m.keyword}"]` : ''}
                              </span>
                            )}
                          </td>

                          {/* Check Interval */}
                          <td className="px-6 py-4 text-xs text-slate-400">
                            Every {m.interval}m
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Pause / Resume */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatus(e, m._id)}
                                className={`p-1.5 rounded-lg transition ${m.status === 'PAUSED'
                                  ? 'text-emerald-400 hover:bg-emerald-500/10'
                                  : 'text-amber-400 hover:bg-amber-500/10'
                                  }`}
                                title={m.status === 'PAUSED' ? 'Resume Monitor' : 'Pause Monitor'}
                              >
                                {m.status === 'PAUSED' ? <Play size={15} /> : <Pause size={15} />}
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteMonitor(e, m._id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="Delete Monitor"
                              >
                                <Trash2 size={15} />
                              </button>

                              {/* Expand Chevron */}
                              <div className="p-1.5 text-slate-500 hover:text-slate-300 transition">
                                <ChevronDown
                                  size={16}
                                  className={`transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180 text-blue-400' : ''
                                    }`}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Animated Expanded Analytics Drawer */}
                        <tr>
                          <td colSpan={6} className="p-0 border-none">
                            <div
                              className={`grid transition-all duration-1000 ease-in-out ${isExpanded
                                ? 'grid-rows-[1fr] opacity-100 border-b border-slate-800'
                                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                                }`}
                            >
                              <div className="overflow-hidden">
                                <div className="p-6 bg-[#0B0F19]/60 border-t border-slate-800/40">
                                  {isAnalyticsLoading ? (
                                    <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                                      <RefreshCw size={15} className="animate-spin text-blue-400" />
                                      Loading telemetry analytics...
                                    </div>
                                  ) : (
                                    <>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Stats Snapshot */}
                                        <div className="bg-[#131b2e] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                                          <div>
                                            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4">
                                              Analytics (Last 30 Days)
                                            </h4>
                                            <div className="space-y-4">
                                              <div>
                                                <p className="text-xs text-slate-400">Uptime Score</p>
                                                <p className="text-3xl font-extrabold text-[#39FF14] mt-0.5">
                                                  {analytics?.uptimePercentage !== undefined
                                                    ? `${analytics.uptimePercentage}%`
                                                    : '100%'}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-slate-400">Avg Latency (24h)</p>
                                                <p className="text-3xl font-extrabold text-white mt-0.5">
                                                  {analytics?.avgResponseTime24h !== undefined
                                                    ? `${analytics.avgResponseTime24h}ms`
                                                    : 'N/A'}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {m.type === 'HEARTBEAT' && (
                                            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                                              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                                                Heartbeat Cron Trigger Command:
                                              </p>
                                              <div className="flex items-center justify-between bg-[#0B0F19] px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                                                <span className="truncate">curl -X POST {getPingUrl(m._id)}</span>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(`curl -X POST ${getPingUrl(m._id)}`);
                                                    setCopiedId(`curl_${m._id}`);
                                                    setTimeout(() => setCopiedId(null), 2000);
                                                  }}
                                                  className="ml-2 text-slate-400 hover:text-blue-400 shrink-0"
                                                  title="Copy curl command"
                                                >
                                                  {copiedId === `curl_${m._id}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                                </button>
                                              </div>
                                              <div className="flex items-center justify-between bg-[#0B0F19] px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                                                <span className="truncate">Invoke-RestMethod -Uri "{getPingUrl(m._id)}" -Method Post</span>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(`Invoke-RestMethod -Uri "${getPingUrl(m._id)}" -Method Post`);
                                                    setCopiedId(`ps_${m._id}`);
                                                    setTimeout(() => setCopiedId(null), 2000);
                                                  }}
                                                  className="ml-2 text-slate-400 hover:text-blue-400 shrink-0"
                                                  title="Copy PowerShell command"
                                                >
                                                  {copiedId === `ps_${m._id}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Response Time Chart */}
                                        <div className="col-span-2 bg-[#131b2e] p-5 rounded-2xl border border-slate-800">
                                          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                                            <div className="flex items-center gap-2.5">
                                              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                                                Response Time Latency (Last 24 Hours)
                                              </h4>
                                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-[#39FF14] border border-emerald-500/20 font-medium tracking-wide">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                                                LIVE (4s)
                                              </span>
                                            </div>
                                            <span className="text-xs text-blue-400 font-mono truncate">
                                              {m.type === 'HEARTBEAT' ? 'Endpoint: Cron Heartbeat Ping' : `Target: ${m.target}`}
                                            </span>
                                          </div>
                                          <ResponseTimeChart data={analytics?.chartData || []} />
                                        </div>
                                      </div>

                                      {/* Live Request & Check Audit Logs Table */}
                                      <div className="mt-6 bg-[#131b2e] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                                        <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2 bg-[#0B0F19]/40">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300">
                                              Live Request & Verification Audit Log
                                            </h4>
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                                              {analytics?.logs?.length || 0} checks logged
                                            </span>
                                          </div>
                                          <span className="text-[11px] text-slate-400 font-sans">
                                            Exact timestamps verified by background engine
                                          </span>
                                        </div>

                                        <div className="overflow-x-auto max-h-64 overflow-y-auto font-mono text-xs">
                                          {analytics?.logs && analytics.logs.length > 0 ? (
                                            <table className="w-full text-left min-w-[600px]">
                                              <thead className="bg-[#0B0F19]/90 text-[10px] text-slate-400 uppercase sticky top-0 backdrop-blur-md border-b border-slate-800 z-10">
                                                <tr>
                                                  <th className="px-5 py-2.5">Timestamp (Hour & Minute)</th>
                                                  <th className="px-5 py-2.5">Status</th>
                                                  <th className="px-5 py-2.5">Latency</th>
                                                  <th className="px-5 py-2.5">Engine Response</th>
                                                  <th className="px-5 py-2.5 text-right">Age</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-800/40">
                                                {analytics.logs.map((log) => {
                                                  const date = new Date(log.timestamp);
                                                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                                  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                                  const isUp = log.status === 'UP';

                                                  return (
                                                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                                                      <td className="px-5 py-2.5 text-slate-300">
                                                        <span className="font-semibold text-white">{timeStr}</span>
                                                        <span className="text-[10px] text-slate-500 ml-2">({dateStr})</span>
                                                      </td>
                                                      <td className="px-5 py-2.5">
                                                        <span
                                                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${isUp
                                                            ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'
                                                            : 'bg-[#FF3131]/10 text-[#FF3131] border border-[#FF3131]/20'
                                                            }`}
                                                        >
                                                          <span
                                                            className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-[#39FF14]' : 'bg-[#FF3131]'
                                                              }`}
                                                          />
                                                          {isUp ? 'HTTP 200 / PASS' : 'OUTAGE / FAIL'}
                                                        </span>
                                                      </td>
                                                      <td className="px-5 py-2.5">
                                                        <span
                                                          className={`font-semibold ${log.responseTime < 300
                                                            ? 'text-emerald-400'
                                                            : log.responseTime < 1000
                                                              ? 'text-amber-400'
                                                              : 'text-rose-400'
                                                            }`}
                                                        >
                                                          {log.responseTime} ms
                                                        </span>
                                                      </td>
                                                      <td className="px-5 py-2.5 text-slate-300 text-[11px] truncate max-w-xs">
                                                        {log.details}
                                                      </td>
                                                      <td className="px-5 py-2.5 text-right text-slate-500 text-[11px]">
                                                        {formatRelativeTime(log.timestamp)}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          ) : (
                                            <div className="py-8 text-center text-slate-500 text-xs">
                                              No ping requests logged yet for this monitor.
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateMonitorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateMonitor}
        isSubmitting={submitting}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => fetchMonitors()}
      />
    </div>
  );
};

export default Dashboard;
