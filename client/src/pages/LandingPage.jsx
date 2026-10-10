import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Zap,
  Globe,
  Mail,
  ArrowRight,
  CheckCircle2,
  Lock,
  Server,
  Heart,
  Type,
  Clock,
  ChevronRight,
  Sparkles,
  BarChart3,
  Terminal,
  Cpu,
  Menu,
  X
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

const LandingPage = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('auth') === 'login') {
      setIsAuthOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleStartFree = async () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleQuickDemo = async () => {
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch {
      setIsAuthOpen(true);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-[#070B14] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[350px] sm:h-[550px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[90px] sm:blur-[140px]"></div>
        <div className="absolute top-[800px] -left-20 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] bg-emerald-500/10 blur-[90px] sm:blur-[130px]"></div>
      </div>

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-20 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
            <Activity className="text-white" size={22} />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Pulse<span className="text-blue-400">Guard</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#protocols" className="hover:text-white transition">5 Check Types</a>
          <a href="#engine" className="hover:text-white transition">Worker Engine</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-sm font-semibold text-slate-300 hover:text-white transition px-3 py-2"
              >
                Sign In
              </button>
              <button
                onClick={handleQuickDemo}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <Sparkles size={16} className="text-yellow-300" />
                Live Demo
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={handleQuickDemo}
            className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Sparkles size={13} className="text-yellow-300" /> Demo
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 rounded-xl border border-slate-700 transition"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-24 z-40 bg-[#0F1524]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-200">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-800/60 transition"
            >
              Features & Highlights
            </a>
            <a
              href="#protocols"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-800/60 transition"
            >
              5 Check Protocols (HTTP, TCP, SSL, Cron)
            </a>
            <a
              href="#engine"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-800/60 transition"
            >
              BullMQ Worker Architecture
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-800/60 transition"
            >
              Pricing & Plans
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-800/60 transition"
            >
              FAQ
            </a>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition"
                >
                  Open Mission Control Dashboard
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsAuthOpen(true); }}
                    className="w-full text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl border border-slate-700 transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleQuickDemo(); }}
                    className="w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg transition"
                  >
                    ⚡ Launch 1-Click Instant Demo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 z-10 w-full">
        <div className="w-full max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] sm:text-xs font-semibold text-slate-200 mb-6 sm:mb-8 shadow-inner max-w-full">
            <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14] animate-pulse shrink-0"></span>
            <span className="truncate">Zero-False-Positive Consensus Engine</span>
            <span className="text-blue-400 font-mono shrink-0">v1.0</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.15] mb-5 sm:mb-8">
            Uptime Monitoring <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
              Built for Mission-Critical Stacks.
            </span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal px-2">
            Pinging your APIs, TCP ports, SSL certificates, keywords, and cron heartbeats every 60 seconds. Powered by BullMQ & Redis workers with strict 3-retry validation and instant incident dispatching.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full max-w-md mx-auto sm:max-w-none">
            <button
              onClick={handleStartFree}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              Start Monitoring Free <ArrowRight size={18} />
            </button>
            <button
              onClick={handleQuickDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#131b2e] hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm sm:text-base px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition transform hover:-translate-y-0.5 shadow-lg"
            >
              <Sparkles size={18} className="text-emerald-400" /> 1-Click NOC Demo
            </button>
          </div>

          {/* Live Simulator Preview Card */}
          <div className="w-full max-w-4xl mx-auto bg-[#0E1424] border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl shadow-black/60 text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] sm:text-xs font-mono text-slate-400 truncate">pulseguard-worker-node-fra-01</span>
              </div>
              <span className="text-[10px] sm:text-xs font-mono text-[#39FF14] flex items-center gap-1.5 shrink-0 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" /> REALTIME
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 py-4 sm:py-6">
              <div className="bg-[#070B14] p-3.5 sm:p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-white">Production Gateway</span>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">HTTP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">HTTP 200 OK</span>
                  <span className="text-xs font-mono text-[#39FF14] font-bold">24ms</span>
                </div>
              </div>

              <div className="bg-[#070B14] p-3.5 sm:p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-white">PostgreSQL Cluster</span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">TCP :5432</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Socket Connected</span>
                  <span className="text-xs font-mono text-[#39FF14] font-bold">12ms</span>
                </div>
              </div>

              <div className="bg-[#070B14] p-3.5 sm:p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-white">Daily Backup Cron</span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">HEARTBEAT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Ping Received</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Active</span>
                </div>
              </div>
            </div>

            {/* 90-Day Simulation Bar */}
            <div className="pt-1 sm:pt-2 w-full">
              <div className="flex justify-between items-center text-[11px] sm:text-xs mb-2 text-slate-400 font-medium">
                <span>90-Day Enterprise Uptime</span>
                <span className="text-white font-bold font-mono">99.98% Operational</span>
              </div>
              <div className="flex items-end gap-[1.5px] sm:gap-1 h-6 w-full overflow-hidden">
                {Array.from({ length: 45 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 min-w-[2px] rounded-xs h-full ${
                      i === 32 ? 'bg-[#FCE205]' : 'bg-[#39FF14]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Matrix Section */}
      <section id="protocols" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0B0F19] border-t border-slate-800/80 w-full">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Protocol Coverage</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-2 text-white">
              5 Check Types. Full Infrastructure Defense.
            </h2>
            <p className="text-slate-400 text-xs sm:text-base mt-2 sm:mt-3 px-2">
              One dashboard to oversee your web services, databases, certificates, and background cron scripts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="bg-[#131b2e] p-5 sm:p-7 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">1. HTTP & HTTPS Pings</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Assures endpoints return valid 200 OK statuses, tracking microsecond response time curves and pinpointing 4xx/5xx failures.
              </p>
              <div className="text-[11px] font-mono text-blue-400 bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800 break-all">
                GET /api/v1/health → 200 OK (38ms)
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#131b2e] p-5 sm:p-7 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Type size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">2. Keyword Verification</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Parses raw response HTML to verify critical keywords exist (e.g. database connection healthy, user signed in).
              </p>
              <div className="text-[11px] font-mono text-amber-400 bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800 break-all">
                Assert body contains: "ALL_SYSTEMS_GO"
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#131b2e] p-5 sm:p-7 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">3. SSL Expiration Sentinel</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Inspects TLS certificates via native Node.js TLS handshake. Dispatches early warnings when certificates drop below 7, 14, or 30 days.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800 break-all">
                TLS Cert Valid (287 days remaining)
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#131b2e] p-5 sm:p-7 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Server size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">4. TCP Port Connectivity</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Tests raw socket reachability for non-HTTP services: PostgreSQL (5432), Redis (6379), MongoDB (27017), or custom microservice ports.
              </p>
              <div className="text-[11px] font-mono text-purple-400 bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800 break-all">
                Socket: 10.0.0.5:5432 → Connected
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-[#131b2e] p-5 sm:p-7 rounded-2xl border border-slate-800 hover:border-rose-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">5. Reverse Cron Heartbeats</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Generates unique endpoints for your scheduled cron jobs. If your script fails or doesn't ping within the grace window, alerts fire immediately.
              </p>
              <div className="text-[11px] font-mono text-rose-400 bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800 break-all">
                POST /api/v1/monitors/:id/ping
              </div>
            </div>

            {/* Card 6 (Engine Feature) */}
            <div className="bg-[#131b2e] p-5 sm:p-7 rounded-2xl border border-slate-800 hover:border-teal-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Cpu size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">3-Retry Verification</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Eliminate 2 AM false alarms. If any check fails, the worker automatically retries 2 more times with a 5-second backoff before declaring an outage.
              </p>
              <div className="text-[11px] font-mono text-teal-400 bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800 break-all">
                Attempt 1 → Retry (5s) → Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Worker Architecture Section */}
      <section id="engine" className="py-16 sm:py-24 px-4 sm:px-6 relative w-full">
        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#131b2e] to-[#0d1322] border border-slate-700/80 rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-2xl">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Architecture</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
                Distributed BullMQ & Redis Engine
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                The monitoring engine runs in a decoupled background process. Repeatable jobs are queued in Redis, consumed asynchronously by worker threads with configurable concurrency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
                <p className="text-xs font-semibold text-slate-300 mt-1">Local Docker Architecture</p>
                <p className="text-xs text-slate-500 mt-0.5">Self-hosted MongoDB & Redis</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#39FF14]">3-Step</p>
                <p className="text-xs font-semibold text-slate-300 mt-1">Retry Consensus</p>
                <p className="text-xs text-slate-500 mt-0.5">Zero false alarm tolerance</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-blue-400">90 Days</p>
                <p className="text-xs font-semibold text-slate-300 mt-1">TTL Auto-Expiring Logs</p>
                <p className="text-xs text-slate-500 mt-0.5">High efficiency storage indexing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0B0F19] border-t border-slate-800/80 w-full">
        <div className="w-full max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Transparent Pricing</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 mb-3">
            Simple, Predictable Plans
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mb-12 sm:mb-16 px-2">
            Get started completely free. Upgrade when your team needs multi-user status pages and high-frequency checks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            {/* Free Plan */}
            <div className="bg-[#131b2e] border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Developer</h3>
                <p className="text-xs text-slate-400 mb-6">For indie hackers and side projects.</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">$0</span>
                  <span className="text-slate-400 text-xs">/ forever</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Up to 10 Monitors</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> 3-Minute Interval Checks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Email Outage & Recovery Alerts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Public Branded Status Page</li>
                </ul>
              </div>
              <button
                onClick={handleStartFree}
                className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-3 rounded-xl transition"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="bg-gradient-to-b from-[#1b2640] to-[#131b2e] border-2 border-blue-500 p-6 sm:p-8 rounded-2xl flex flex-col justify-between relative shadow-2xl shadow-blue-900/30">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md shrink-0">
                MOST POPULAR
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Production Pro</h3>
                <p className="text-xs text-slate-300 mb-6">For growing SaaS & production teams.</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">$29</span>
                  <span className="text-slate-400 text-xs">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Up to 100 Monitors</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> 1-Minute Rapid Interval Checks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Custom Domain Status Pages</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> 90-Day Full Telemetry Retention</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Priority Email & Webhook Alerts</li>
                </ul>
              </div>
              <button
                onClick={handleStartFree}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[#131b2e] border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Enterprise NOC</h3>
                <p className="text-xs text-slate-400 mb-6">For high-traffic infrastructure.</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">$99</span>
                  <span className="text-slate-400 text-xs">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Unlimited Monitors</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Multi-Region Consensus Checking</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> Dedicated Worker Concurrency</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#39FF14] shrink-0" /> 99.99% SLA Guarantee</li>
                </ul>
              </div>
              <button
                onClick={handleStartFree}
                className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-3 rounded-xl transition"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 w-full">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Knowledge Base</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {[
              {
                q: 'How does the 3-retry logic prevent false alarms?',
                a: 'Whenever an initial probe detects an error (such as a timeout or HTTP 502), PulseGuard does not alert immediately. It holds execution and runs 2 additional retry probes with a 5-second backoff. Only if all 3 consecutive attempts fail is an outage confirmed and an alert dispatched.',
              },
              {
                q: 'How do Reverse Heartbeat (Cron) monitors work?',
                a: 'PulseGuard generates a unique ping endpoint for each heartbeat monitor. Your cron job or scheduled script simply issues an HTTP GET or POST request to this URL. If your script crashes or the server goes down and no ping arrives within the allowed interval, an outage alert is immediately sent.',
              },
              {
                q: 'Can I share the 90-day status page with my customers?',
                a: 'Yes! Any monitor with "Public Status Page" enabled appears on your dedicated public status page at /status/:companyName. It includes live system health, response metrics, and interactive 90-day uptime bars with hover tooltips.',
              },
              {
                q: 'Is my database and data kept locally?',
                a: 'Yes. PulseGuard runs completely containerized using local MongoDB and Redis instances. No external third-party cloud database access is required.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-[#131b2e] border border-slate-800 p-5 sm:p-6 rounded-2xl">
                <h3 className="font-bold text-white text-sm sm:text-base mb-1.5">{faq.q}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent text-center w-full">
        <div className="w-full max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight">
            Ready to secure your uptime?
          </h2>
          <p className="text-slate-400 text-xs sm:text-base mb-6 sm:mb-8 max-w-xl mx-auto px-2">
            Get instant visibility into your web apps, APIs, databases, and cron jobs in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none">
            <button
              onClick={handleStartFree}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              Launch PulseGuard Free
            </button>
            <button
              onClick={handleQuickDemo}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition"
            >
              ⚡ Instant 1-Click Demo
            </button>
          </div>
        </div>
      </section>

      {/* Copyright Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6 text-center text-xs text-slate-500 w-full">
        <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Activity size={18} className="text-blue-500" /> PulseGuard
          </div>
          <p>© {new Date().getFullYear()} PulseGuard Inc. High Availability Uptime Monitoring Platform.</p>
          <div className="flex gap-4">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#protocols" className="hover:text-white transition">Protocols</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => navigate('/dashboard')}
      />
    </div>
  );
};

export default LandingPage;
