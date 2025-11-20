

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginAsAdmin } = useAuth();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '123456') { // Hardcoded password as per original logic
            loginAsAdmin();
            onClose();
        } else {
            setError('Incorrect password.');
            setPassword('');
        }
    };
    
    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    }

    return (
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg-primary/50 backdrop-blur-md">
              <motion.div
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  initial: { scale: 0.9, opacity: 0, y: 20 },
                  animate: { scale: 1, opacity: 1, y: 0 },
                  exit: { scale: 0.9, opacity: 0, y: 20 },
                  transition: { type: 'spring', stiffness: 260, damping: 20 },
                }}
                className="w-full max-w-sm p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative"
              >
                <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="text-center">
                    <LockClosedIcon className="w-10 h-10 mx-auto text-primary-start mb-4"/>
                    <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
                    <p className="text-gray-400 mb-6">Enter the password to continue.</p>
                </div>
                
                <form onSubmit={handleLogin}>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Password"
                      className={`w-full text-center px-4 py-2.5 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${error ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-primary-start'}`}
                      required
                      autoFocus
                    />
                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                    <button
                      type="submit"
                      className="w-full mt-4 px-4 py-3 bg-primary-start text-white rounded-lg font-semibold hover:bg-primary-start/80 transition-colors"
                    >
                        Authenticate
                    </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    );
};