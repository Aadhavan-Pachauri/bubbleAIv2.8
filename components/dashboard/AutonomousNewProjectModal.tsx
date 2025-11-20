import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface AutonomousNewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (prompt: string) => Promise<void>;
}

export const AutonomousNewProjectModal: React.FC<AutonomousNewProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [prompt, setPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isCreating) return;

    setIsCreating(true);
    setError(null);
    try {
      await onCreate(prompt);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleClose = () => {
    setPrompt('');
    setIsCreating(false);
    setError(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/50 backdrop-blur-md">
          <motion.div
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              initial: { scale: 0.9, opacity: 0, y: 20 },
              animate: { scale: 1, opacity: 1, y: 0 },
              exit: { scale: 0.9, opacity: 0, y: 20 },
              transition: { type: 'spring', stiffness: 260, damping: 20 },
            }}
            className="w-full max-w-lg p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative"
          >
            <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
            <div className="text-center">
              <SparklesIcon className="w-10 h-10 mx-auto text-primary-start mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Create with AI</h2>
              <p className="text-gray-400 mb-6">Describe your idea, and the AI will set up the entire project for you.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A racing game with crazy power-ups and customizable cars"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-start transition-colors resize-none"
                rows={4}
                required
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
              <button
                type="submit"
                disabled={!prompt.trim() || isCreating}
                className="w-full mt-4 h-[51px] flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-start/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Generate Project'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};