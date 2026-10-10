import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Building, Zap, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [rendered, setRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setCompanyName('');
    setError('');
  };

  // Synchronize open and exit animation lifecycle
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setRendered(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (rendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRendered(false);
        setIsClosing(false);
        resetForm();
        document.body.style.overflow = '';
      }, 200);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleRequestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      resetForm();
      onClose();
    }, 200);
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && rendered && !isClosing) {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rendered, isClosing]);

  if (!rendered) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(email, password, companyName || 'My Team');
      } else {
        await login(email, password);
      }
      handleRequestClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await demoLogin();
      handleRequestClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize demo session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleRequestClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-x-hidden ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
    >
      <div
        className={`relative w-full max-w-md bg-[#111726] border border-slate-700/80 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-blue-950/60 text-white overflow-hidden ${
          isClosing ? 'animate-modal-content-out' : 'animate-modal-content'
        }`}
      >
        {/* Subtle Ambient Radial Glow (Safely isolated inside container) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className="absolute -top-24 -left-24 w-52 h-52 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleRequestClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-slate-800/80 active:scale-95 z-20"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Zap size={13} className="text-blue-400 animate-pulse" /> NOC ACCESS CONTROL
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            {isRegister ? 'Create Operator Account' : 'Welcome to PulseGuard'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
            {isRegister
              ? 'Set up your credentials to begin enterprise monitoring.'
              : 'Sign in to access real-time NOC mission telemetry.'}
          </p>
        </div>

        {/* Animated Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#090D18] rounded-2xl border border-slate-800/80 mb-5 relative z-10">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              !isRegister
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              isRegister
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* 1-Click Instant Demo Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="group w-full mb-5 flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-xs sm:text-sm relative z-10 border border-emerald-400/20"
        >
          {isLoading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Sparkles size={17} className="text-amber-300 group-hover:rotate-12 transition-transform" />
          )}
          <span>1-Click Instant Demo (Acme Corp)</span>
        </button>

        <div className="relative flex items-center justify-center mb-5 z-10">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#111726] px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            or continue with email
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium animate-modal-content">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isRegister && (
            <div className="transition-all duration-300">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company / Organization
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#090D18] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="email"
                required
                placeholder="dev@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#090D18] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#090D18] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-xs sm:text-sm"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Account & Enter' : 'Sign In to Mission Control'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 relative z-10">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className="text-blue-400 font-semibold hover:underline ml-1"
              >
                Sign in here
              </button>
            </>
          ) : (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className="text-blue-400 font-semibold hover:underline ml-1"
              >
                Create one now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
