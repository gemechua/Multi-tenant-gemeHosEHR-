import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full sm:w-[380px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  key?: string;
  toast: ToastItem;
  onClose: () => void;
}

function ToastCard({ toast, onClose }: ToastCardProps) {
  const { type, message, duration = 4000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-100',
          text: 'text-emerald-950',
          iconColor: 'text-emerald-500',
          progressBg: 'bg-emerald-500',
          Icon: CheckCircle2,
        };
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-100',
          text: 'text-rose-950',
          iconColor: 'text-rose-500',
          progressBg: 'bg-rose-500',
          Icon: AlertCircle,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-100',
          text: 'text-blue-950',
          iconColor: 'text-blue-500',
          progressBg: 'bg-blue-500',
          Icon: Info,
        };
    }
  };

  const styles = getStyles();
  const Icon = styles.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden p-4 rounded-xl border shadow-lg flex gap-3 items-start ${styles.bg} ${styles.text}`}
    >
      <div className={`mt-0.5 shrink-0 ${styles.iconColor}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 p-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={14} />
      </button>

      {/* Progress bar representing remaining duration */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 ${styles.progressBg}`}
      />
    </motion.div>
  );
}
