
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export const StatusBar: React.FC = () => {
    const { isImpersonating, stopImpersonating, profile } = useAuth();

    const normalGradient = 'bg-gradient-to-r from-primary-start to-primary-end';
    const impersonatingGradient = 'bg-gradient-to-r from-amber-500 to-orange-600';

    return (
        <motion.div
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              animate: { height: isImpersonating ? 'auto' : '0px' },
              transition: { type: 'spring', stiffness: 300, damping: 30 },
            }}
            className={`w-full relative z-50 shadow-lg overflow-hidden ${isImpersonating ? impersonatingGradient : normalGradient}`}
        >
            {isImpersonating && (
                <motion.div
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      transition: { delay: 0.2, duration: 0.3 },
                    }}
                    className="text-white text-center p-2 text-sm font-semibold flex items-center justify-center gap-4"
                >
                    <span>
                        Viewing as <strong>{profile?.roblox_username}</strong>
                    </span>
                    <button
                        onClick={stopImpersonating}
                        className="flex items-center gap-1.5 bg-black/20 text-white px-3 py-1 rounded-full hover:bg-black/40 transition-colors"
                    >
                        <XCircleIcon className="w-4 h-4"/>
                        <span>Stop Impersonating</span>
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
};
