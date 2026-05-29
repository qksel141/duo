import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Heart, Sparkles, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast는 ToastProvider 안에서 사용해야 합니다.');
  }
  return ctx;
}

let counter = 0;
function nextId() {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ kind = 'info', title, message, duration = 4500, onClick }) => {
      const id = nextId();
      setToasts((prev) => [
        ...prev,
        { id, kind, title, message, onClick },
      ]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }) {
  const { kind, title, message, onClick } = toast;

  const palette =
    kind === 'match'
      ? {
          border: 'border-violet-500/50',
          bg: 'bg-gradient-to-br from-violet-700/40 via-fuchsia-700/30 to-black/60',
          glow: 'shadow-[0_0_40px_rgba(168,85,247,0.45)]',
          icon: <Sparkles size={18} className="text-fuchsia-300" />,
        }
      : kind === 'like'
        ? {
            border: 'border-pink-500/40',
            bg: 'bg-gradient-to-br from-pink-700/30 via-rose-700/20 to-black/60',
            glow: 'shadow-[0_0_30px_rgba(236,72,153,0.35)]',
            icon: <Heart size={18} className="text-pink-300" />,
          }
        : {
            border: 'border-white/15',
            bg: 'bg-black/70',
            glow: 'shadow-[0_0_20px_rgba(0,0,0,0.6)]',
            icon: null,
          };

  return (
    <div
      onClick={() => {
        if (onClick) onClick();
        onClose();
      }}
      className={`
        pointer-events-auto
        ${palette.bg}
        backdrop-blur-xl
        border ${palette.border}
        ${palette.glow}
        rounded-2xl
        min-w-[280px] max-w-sm
        px-5 py-4
        cursor-pointer
        animate-toast-in
      `}
      style={{
        animation: 'toast-in 220ms ease-out',
      }}
    >
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="flex items-start gap-3">
        {palette.icon && (
          <div className="mt-0.5">{palette.icon}</div>
        )}

        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-black text-white truncate">
              {title}
            </p>
          )}
          {message && (
            <p className="text-xs text-stone-200 mt-1 leading-snug">
              {message}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-stone-400 hover:text-white shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
