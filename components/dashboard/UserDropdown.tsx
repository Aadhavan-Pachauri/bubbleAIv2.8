

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Cog6ToothIcon, ArrowLeftOnRectangleIcon, SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid';

interface UserDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onSettingsClick?: () => void;
    onLogout?: () => void;
    isAdminView?: boolean;
    onSwitchToAutonomous?: () => void;
    onSwitchToCocreator?: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ 
    isOpen, 
    onClose, 
    onSettingsClick, 
    onLogout, 
    isAdminView = false, 
    onSwitchToAutonomous,
    onSwitchToCocreator
}) => {
    const { user, profile, isImpersonating } = useAuth();

    const handleSettings = () => {
        onSettingsClick?.();
        onClose();
    }

    const handleLogout = () => {
        onLogout?.();
        onClose();
    }

    const handleSwitchToAuto = () => {
        onSwitchToAutonomous?.();
        onClose();
    }

    const handleSwitchToCocreator = () => {
        onSwitchToCocreator?.();
        onClose();
    }
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0, y: -10, scale: 0.95 },
                      animate: { opacity: 1, y: 0, scale: 1 },
                      exit: { opacity: 0, y: -10, scale: 0.95 },
                      transition: { duration: 0.15, ease: 'easeOut' },
                    }}
                    className="absolute right-0 top-full mt-2 w-64 bg-bg-secondary/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                    <div className="p-4 border-b border-white/10">
                        <p className="font-semibold text-text-primary truncate">{profile?.roblox_username || 'User'}</p>
                        <p className="text-sm text-text-secondary truncate">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs px-2 py-1 bg-white/5 rounded-full w-fit">
                            <SparklesIconSolid className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium text-text-secondary">
                                {profile?.membership === 'admin' 
                                    ? 'Unlimited' 
                                    : `${(profile?.credits ?? 0).toLocaleString()} Credits`}
                            </span>
                        </div>
                    </div>
                    <div className="p-2">
                         <button onClick={handleSwitchToAuto} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary rounded-md hover:bg-interactive-hover hover:text-text-primary transition-colors">
                            <SparklesIconSolid className="w-5 h-5" />
                            <span>Autonomous Mode</span>
                        </button>
                        <button onClick={handleSwitchToCocreator} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary rounded-md hover:bg-interactive-hover hover:text-text-primary transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                             <span>Co-Creator Hub</span>
                        </button>
                    </div>
                     <div className="p-2 border-t border-white/10">
                        {onSettingsClick && (
                            <button onClick={handleSettings} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary rounded-md hover:bg-interactive-hover hover:text-text-primary transition-colors">
                                <Cog6ToothIcon className="w-5 h-5" />
                                <span>Settings</span>
                            </button>
                        )}
                        {onLogout && (
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20 hover:text-red-300 transition-colors">
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                <span>{isImpersonating ? 'Stop Impersonating' : 'Logout'}</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}