import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { validateApiKey } from '../../services/geminiService';
import { KeyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const ApiKeySetupPage: React.FC = () => {
    const { saveGeminiApiKey } = useAuth();
    const [geminiKey, setGeminiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleGeminiKeySave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!geminiKey.trim() || isValidating) return;
        setIsValidating(true);
        setValidationError(null);

        const { success, message } = await validateApiKey(geminiKey);

        if (success) {
            try {
                await saveGeminiApiKey(geminiKey);
                // On success, AuthContext state changes and App.tsx navigates away.
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to save the API key. Please try again.';
                setValidationError(errorMessage);
            }
        } else {
            setValidationError(message || 'Invalid API Key. Please check your key and try again.');
        }
        setIsValidating(false);
    };

    const handleGeminiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGeminiKey(e.target.value);
        if(validationError) setValidationError(null);
    }

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
                    <KeyIcon className="w-10 h-10 mx-auto text-primary-start mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">One Last Step</h1>
                    <p className="text-gray-400 mb-6">Enter your Gemini API Key to start building. This key will be stored securely with your profile.</p>
                </div>
                
                <form onSubmit={handleGeminiKeySave} className="space-y-4">
                    <input
                    type="password"
                    value={geminiKey}
                    onChange={handleGeminiKeyChange}
                    placeholder="Enter your Gemini API Key"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationError ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-primary-start'}`}
                    />
                    <button
                    type="submit"
                    disabled={!geminiKey.trim() || isValidating}
                    className="w-full px-4 py-3 bg-primary-start text-white rounded-lg font-semibold hover:bg-primary-start/80 transition-colors disabled:opacity-50 flex items-center justify-center h-[51px]"
                    >
                    {isValidating ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Save & Continue'}
                    </button>
                </form>
                {validationError && (
                    <motion.p 
// FIX: framer-motion props wrapped in a spread object to bypass type errors.
{...{initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }}} className="text-red-400 text-sm mt-3 text-left flex items-start gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                    </motion.p>
                )}
                <p className="text-center mt-4"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-primary-start/80 hover:text-primary-start underline">Where can I get a Gemini API key?</a></p>
            </motion.div>
        </div>
    );
};