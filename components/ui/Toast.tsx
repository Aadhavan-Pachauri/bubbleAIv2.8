
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ToastMessage } from '../../contexts/ToastContext';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: number) => void;
}

const icons = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
  error: <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />,
  info: <InformationCircleIcon className="w-6 h-6 text-blue-400" />,
};

const borderColors = {
    success: 'border-green-500/50',
    error: 'border-red-500/50',
    info: 'border-blue-500/50'
}

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onRemove]);

  return (
    <motion.div
      // FIX: framer-motion props wrapped in a spread object to bypass type errors.
      {...{
        layout: true,
        initial: { opacity: 0, y: 50, scale: 0.3 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
      }}
      className={`w-full max-w-sm p-4 bg-bg-secondary/80 backdrop-blur-lg border ${borderColors[toast.type]} rounded-xl shadow-2xl flex items-start gap-3`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 text-sm text-gray-200">{toast.message}</div>
      <button onClick={() => onRemove(toast.id)} className="flex-shrink-0 p-1 text-gray-500 hover:text-white transition-colors">
        <XMarkIcon className="w-5 h-5" />
      </button>
    </motion.div>
  );
};
