// src/context/ToastContext.jsx
// Drop-in global toast/popup system — wraps entire app
// Usage anywhere: const { toast } = useToast();
//   toast.success('Done!') | toast.error('Oops') | toast.info('FYI') | toast.loading('...')

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};

let _toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x));
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 320);
  }, []);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_toastId;
    setToasts(t => [{ id, message, type, leaving: false }, ...t].slice(0, 5));
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error', dur ?? 5000),
    info:    (msg, dur) => show(msg, 'info', dur),
    loading: (msg)      => show(msg, 'loading', 0),
    dismiss,
  };

  const icons = {
    success: '✅',
    error:   '❌',
    info:    '💡',
    loading: '⏳',
  };

  const colors = {
    success: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', icon: '#10b981' },
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '#ef4444' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: '#3b82f6' },
    loading: { bg: '#fafafa', border: '#e2e8f0', text: '#334155', icon: '#94a3b8' },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 360, width: 'calc(100vw - 40px)',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = colors[t.type];
          return (
            <div key={t.id} style={{
              background: c.bg, border: `1.5px solid ${c.border}`,
              borderRadius: 14, padding: '13px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 11,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              pointerEvents: 'all', cursor: 'pointer',
              opacity: t.leaving ? 0 : 1,
              transform: t.leaving ? 'translateX(24px)' : 'translateX(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              animation: t.leaving ? 'none' : 'toastIn 0.28s ease',
            }} onClick={() => dismiss(t.id)}>
              <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1.4 }}>
                {t.type === 'loading'
                  ? <span style={{ display:'inline-block', animation:'toastSpin 0.8s linear infinite' }}>⟳</span>
                  : icons[t.type]}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: c.text, lineHeight: 1.5, flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t.message}
              </span>
              <button onClick={e => { e.stopPropagation(); dismiss(t.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.icon, fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>×</button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(24px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes toastSpin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};