import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, CheckCircle, AlertTriangle, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../services/api';
import UptimeBar from '../components/UptimeBar';

const StatusPage = () => {
  const { companyName } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStatus = async () => {
    try {
      setError(null);
      const res = await api.get(`/status/${encodeURIComponent(companyName)}`);
      setData(res.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Status page not found for this identifier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh public status page every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [companyName]);

  const isAllOperational = data?.globalStatus === 'All Systems Operational';
  const isPartialOutage = data?.globalStatus?.toLowerCase().includes('outage');

  return (
    <div className="min-h-screen w-full max-w-full bg-[#0B0F19] text-white font-sans py-10 sm:py-16 px-4 sm:px-6 selection:bg-blue-500/30 overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={16} /> Return to PulseGuard
          </Link>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700"
            title="Refresh Status"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-blue-400' : ''} />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </button>
        </div>

        {/* Header */}
        <header className="flex flex-col items-center justify-center mb-12 text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_35px_rgba(59,130,246,0.25)] border border-blue-500/20">
            <Activity size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">
            {data?.companyName || companyName} Status
          </h1>
          <p className="text-slate-400 text-sm">
            Live service health telemetry and 90-day reliability audit.
          </p>
        </header>

        {loading && !data ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <p className="text-sm">Fetching live telemetry logs...</p>
          </div>
        ) : error ? (
          <div className="bg-[#131b2e] border border-rose-500/30 p-8 rounded-2xl text-center">
            <ShieldAlert size={36} className="text-rose-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">Status Page Unavailable</h2>
            <p className="text-slate-400 text-xs mb-6 max-w-md mx-auto">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Global Status Banner */}
            <div
              className={`p-6 rounded-2xl flex items-center gap-4 mb-10 border shadow-2xl transition ${
                isAllOperational
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-950/20'
                  : isPartialOutage
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-950/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-950/20'
              }`}
            >
              {isAllOperational ? (
                <CheckCircle size={32} className="shrink-0" />
              ) : (
                <AlertTriangle size={32} className="shrink-0" />
              )}
              <div>
                <h2 className="text-xl font-bold tracking-tight">{data.globalStatus}</h2>
                <p className="text-xs opacity-80 mt-0.5">
                  Verified across all globally distributed monitoring nodes.
                </p>
              </div>
            </div>

            {/* Monitors List */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-base font-bold text-white">Monitored Services</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {data.monitors?.length || 0} Endpoints Active
                </span>
              </div>

              {data.monitors?.length === 0 ? (
                <div className="bg-[#131b2e] border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-sm">
                  No public monitors have been enabled for this status page yet.
                </div>
              ) : (
                data.monitors.map((monitor) => (
                  <div
                    key={monitor._id}
                    className="bg-[#131b2e] border border-slate-800 hover:border-slate-700/80 transition p-6 rounded-2xl shadow-lg shadow-black/20"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            monitor.status === 'UP'
                              ? 'bg-[#39FF14] shadow-[0_0_8px_#39FF14]'
                              : monitor.status === 'DOWN'
                              ? 'bg-[#FF3131] shadow-[0_0_8px_#FF3131]'
                              : 'bg-slate-500'
                          }`}
                        />
                        <div>
                          <h4 className="font-bold text-base text-white">{monitor.name}</h4>
                          <span className="text-[11px] font-mono text-slate-400 bg-[#0B0F19] px-2 py-0.5 rounded border border-slate-800">
                            {monitor.type}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-extrabold text-white">
                          {monitor.uptime90Days}%
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">
                          90-Day Uptime
                        </p>
                      </div>
                    </div>

                    {/* Uptime Bars Component */}
                    <UptimeBar history={monitor.history || []} />

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium">
                      <span>90 days ago</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#39FF14]" /> 100%
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FCE205]" /> Degraded
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FF3131]" /> Outage
                        </span>
                      </div>
                      <span>Today</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-20 text-center text-xs text-slate-500 border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PulseGuard Inc. High-availability uptime monitoring.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-white transition">About</Link>
            <Link to="/dashboard" className="hover:text-white transition">Dashboard</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StatusPage;
