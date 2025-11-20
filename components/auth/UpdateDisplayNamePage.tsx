

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export const UpdateDisplayNamePage: React.FC = () => {
    const { profile, updateUserProfile } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.roblox_username) {
            // Pre-fill with the part of their email before the '@' symbol
            const currentName = profile.roblox_username;
            const atIndex = currentName.indexOf('@');
            if (atIndex !== -1) {
                setDisplayName(currentName.substring(0, atIndex));
            } else {
                setDisplayName(currentName);
            }
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || isLoading || displayName.trim() === profile?.roblox_username) return;

        setIsLoading(true);
        setError(null);
        try {
            await updateUserProfile({ roblox_username: displayName.trim() });
            // On success, the AuthContext state will change and App.tsx will navigate away.
        } catch (err) {
            if (err instanceof Error && err.message.includes('Failed to fetch')) {
                setError("Could not update your profile. Please check your network connection and try again.");
            } else {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-bg-primary text-white p-4">
            <motion.div
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  initial: { scale: 0.95, opacity: 0, y: 20 },
                  animate: { scale: 1, opacity: 1, y: 0 },
                  transition: { duration: 0.3 },
                }}
                className="w-full max-w-md p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
            >
                <div className="text-center">
                    <UserCircleIcon className="w-12 h-12 mx-auto text-primary-start mb-4" />
                    <h1 className="text-3xl font-bold text-white mt-3 mb-2">Update Your Profile</h1>
                    <p className="text-gray-400 mb-6">It looks like we're using your email as your display name. Please set a new one to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                            New Display Name
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g., Awesome Developer"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-start transition-colors"
                            required
                            autoFocus
                        />
                    </div>
                    
                    {error && (
                        <p className="text-red-400 text-sm text-left flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {`Error: ${error}`}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!displayName.trim() || isLoading}
                        className="w-full px-4 py-3 bg-primary-start text-white rounded-lg font-semibold hover:bg-primary-start/80 transition-colors disabled:opacity-50 flex items-center justify-center h-[51px]"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Save & Continue'
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};