import React, { useState, useEffect } from 'react';
import { X, Globe, Type, Lock, Network, Heart, Info, Loader2, ChevronDown, PlusCircle } from 'lucide-react';

const INITIAL_FORM_STATE = {
  name: '',
  type: 'HTTP',
  target: '',
  port: '',
  keyword: '',
  interval: 1,
  isPublic: true,
};

const CreateMonitorModal = ({ isOpen, onClose, onSubmit, isSubmitting = false }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [rendered, setRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  // Synchronize open/closing states with smooth exit animation & clean form state reset
  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_STATE);
      setRendered(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (rendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRendered(false);
        setIsClosing(false);
        setFormData(INITIAL_FORM_STATE);
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
      setFormData(INITIAL_FORM_STATE);
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

  const handleTypeSelect = (newType) => {
    if (formData.type === newType) return;
    // Wipe all previous inputs completely when switching protocol / request type
    setFormData({
      ...INITIAL_FORM_STATE,
      type: newType,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      interval: Number(formData.interval),
    };
    if (formData.type === 'TCP' && formData.port) {
      payload.port = Number(formData.port);
    }
    onSubmit(payload);
    // Reset form immediately on submission
    setFormData(INITIAL_FORM_STATE);
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
        className={`relative bg-[#111726] w-full max-w-xl rounded-3xl border border-slate-700/80 shadow-2xl shadow-blue-950/60 text-white overflow-hidden flex flex-col max-h-[90vh] ${
          isClosing ? 'animate-modal-content-out' : 'animate-modal-content'
        }`}
      >
        {/* Isolated Ambient Glows (Clipped cleanly within container) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className="absolute -top-20 -left-20 w-52 h-52 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-800 flex justify-between items-start relative z-10 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <PlusCircle size={13} className="text-blue-400" /> NEW MISSION CHECK
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Configure New Monitor</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Active distributed checks with zero-false-positive 3-retry verification.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-slate-800/80 active:scale-95"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body with Smooth Internal Scroll */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden relative z-10">
          <div className="px-6 sm:px-8 py-5 overflow-y-auto space-y-4 flex-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Monitor Name
              </label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#090D18] border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                placeholder="e.g. Production API Gateway"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Check Protocol / Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { type: 'HTTP', label: 'HTTP / Web', icon: Globe },
                  { type: 'KEYWORD', label: 'Keyword', icon: Type },
                  { type: 'SSL', label: 'SSL Cert', icon: Lock },
                  { type: 'TCP', label: 'TCP Port', icon: Network },
                  { type: 'HEARTBEAT', label: 'Cron Heartbeat', icon: Heart },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = formData.type === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleTypeSelect(item.type)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20 scale-[1.02]'
                          : 'bg-[#090D18] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:scale-[1.01]'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-blue-400' : 'text-slate-500'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.type === 'HEARTBEAT' ? (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-300 flex items-start gap-3 animate-modal-content">
                <Info size={18} className="shrink-0 mt-0.5 text-blue-400" />
                <div>
                  <p className="font-bold text-white mb-1">Reverse Cron Heartbeat Telemetry</p>
                  <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                    Upon creation, a unique ping endpoint will be generated. Your scheduled cron job or microservice simply sends a GET/POST ping. If no ping is received within your configured interval, an outage incident is automatically triggered.
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-modal-content">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {formData.type === 'SSL'
                    ? 'Domain or URL'
                    : formData.type === 'TCP'
                    ? 'Host / IP Address'
                    : 'Target Endpoint URL'}
                </label>
                <input
                  required
                  name="target"
                  value={formData.target}
                  onChange={handleChange}
                  className="w-full bg-[#090D18] border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-mono"
                  placeholder={
                    formData.type === 'SSL'
                      ? 'https://example.com'
                      : formData.type === 'TCP'
                      ? '192.168.1.1 or db.internal.net'
                      : 'https://api.pulseguard.io/health'
                  }
                />
              </div>
            )}

            {formData.type === 'TCP' && (
              <div className="animate-modal-content">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  TCP Port Number
                </label>
                <input
                  required
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  className="w-full bg-[#090D18] border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-mono"
                  placeholder="5432 (Postgres), 6379 (Redis), 80, 443"
                />
              </div>
            )}

            {formData.type === 'KEYWORD' && (
              <div className="animate-modal-content">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Expected Response Body Keyword
                </label>
                <input
                  required
                  name="keyword"
                  value={formData.keyword}
                  onChange={handleChange}
                  className="w-full bg-[#090D18] border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-mono"
                  placeholder="e.g. 'ok', 'healthy', 'SYSTEM_OPERATIONAL'"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Verification Frequency
                </label>
                <div className="relative">
                  <select
                    name="interval"
                    value={formData.interval}
                    onChange={handleChange}
                    className="w-full bg-[#090D18] border border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none pr-10 transition cursor-pointer"
                  >
                    <option value={1} className="bg-[#111726] text-white">Every 1 minute (High Frequency)</option>
                    <option value={3} className="bg-[#111726] text-white">Every 3 minutes (Standard)</option>
                    <option value={5} className="bg-[#111726] text-white">Every 5 minutes (Relaxed)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" size={17} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Status Page Visibility
                </label>
                <label className="flex items-center gap-3 p-3 bg-[#090D18] border border-slate-700/80 rounded-xl cursor-pointer hover:border-slate-600 transition">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                  <span className="text-xs text-slate-300 font-semibold">Publish on Status Page</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-slate-800 bg-[#0E1424] flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800/80 transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save & Launch Monitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMonitorModal;
