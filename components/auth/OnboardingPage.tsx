import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingPreferences } from '../../types';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

type Step = 'experience' | 'style' | 'density' | 'theme';

const stepToPreferenceKey: Record<Step, keyof OnboardingPreferences> = {
    experience: 'experience_level',
    style: 'ui_style',
    density: 'ui_density',
    theme: 'ui_theme',
};

const OptionCard: React.FC<{ title: string; description: string; selected: boolean; onClick: () => void; }> = ({ title, description, selected, onClick }) => (
    <motion.div
        onClick={onClick}
        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 relative ${selected ? 'border-primary-start bg-primary-start/10' : 'border-bg-tertiary hover:border-primary-start/50 bg-bg-secondary'}`}
        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
        {...{
          whileHover: { scale: 1.03 },
          whileTap: { scale: 0.98 },
        }}
    >
        {selected && (
            <CheckCircleIcon className="w-6 h-6 text-primary-start absolute top-3 right-3" />
        )}
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
);

export const OnboardingPage: React.FC = () => {
    const { updateUserProfile } = useAuth();
    const [step, setStep] = useState<Step>('experience');
    const [preferences, setPreferences] = useState<Partial<OnboardingPreferences>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelect = (key: keyof OnboardingPreferences, value: any) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const nextStep = () => {
        switch (step) {
            case 'experience': setStep('style'); break;
            case 'style': setStep('density'); break;
            case 'density': setStep('theme'); break;
            case 'theme': handleSubmit(); break;
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const finalPrefs = preferences as OnboardingPreferences;
            await updateUserProfile({ 
                onboarding_preferences: finalPrefs,
                ui_theme: finalPrefs.ui_theme, // Also apply theme to the main profile setting
            });
            // On success, AuthContext state changes and App.tsx navigates away.
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'An unknown error occurred while saving preferences.';
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'experience':
                return (
                    <div className="space-y-4">
                        <OptionCard title="Beginner" description="Just starting out, need guidance." selected={preferences.experience_level === 'beginner'} onClick={() => handleSelect('experience_level', 'beginner')} />
                        <OptionCard title="Intermediate" description="I know my way around, but still learning." selected={preferences.experience_level === 'intermediate'} onClick={() => handleSelect('experience_level', 'intermediate')} />
                        <OptionCard title="Expert" description="I'm a seasoned pro, show me everything." selected={preferences.experience_level === 'expert'} onClick={() => handleSelect('experience_level', 'expert')} />
                    </div>
                );
            case 'style':
                 return (
                    <div className="space-y-4">
                        <OptionCard title="Minimal" description="Clean and simple, just the essentials." selected={preferences.ui_style === 'minimal'} onClick={() => handleSelect('ui_style', 'minimal')} />
                        <OptionCard title="Standard" description="A balanced layout with common tools." selected={preferences.ui_style === 'standard'} onClick={() => handleSelect('ui_style', 'standard')} />
                        <OptionCard title="Advanced" description="All panels and tools visible for power users." selected={preferences.ui_style === 'advanced'} onClick={() => handleSelect('ui_style', 'advanced')} />
                    </div>
                );
            case 'density':
                 return (
                    <div className="space-y-4">
                        <OptionCard title="Spacious" description="Lots of room to breathe." selected={preferences.ui_density === 'spacious'} onClick={() => handleSelect('ui_density', 'spacious')} />
                        <OptionCard title="Comfortable" description="A good balance of space and information." selected={preferences.ui_density === 'comfortable'} onClick={() => handleSelect('ui_density', 'comfortable')} />
                        <OptionCard title="Compact" description="See more on the screen at once." selected={preferences.ui_density === 'compact'} onClick={() => handleSelect('ui_density', 'compact')} />
                    </div>
                );
            case 'theme':
                return (
                    <div className="space-y-4">
                        <OptionCard title="Light" description="A bright, clean interface." selected={preferences.ui_theme === 'light'} onClick={() => handleSelect('ui_theme', 'light')} />
                        <OptionCard title="Dark" description="Easier on the eyes in low light." selected={preferences.ui_theme === 'dark'} onClick={() => handleSelect('ui_theme', 'dark')} />
                        <OptionCard title="Auto" description="Syncs with your system's theme." selected={preferences.ui_theme === 'auto'} onClick={() => handleSelect('ui_theme', 'auto')} />
                    </div>
                );
        }
    };
    
    const stepTitles: Record<Step, string> = {
        experience: "How would you describe your experience?",
        style: "What's your preferred UI style?",
        density: "Choose your information density.",
        theme: "Finally, pick a theme."
    }

    const isNextDisabled = !preferences[stepToPreferenceKey[step]];

    return (
         <div className="flex items-center justify-center h-screen bg-bg-primary text-white p-4">
            <motion.div
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  initial: { scale: 0.95, opacity: 0, y: 20 },
                  animate: { scale: 1, opacity: 1, y: 0 },
                  transition: { duration: 0.3 },
                }}
                className="w-full max-w-lg p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">{stepTitles[step]}</h1>
                </div>

                <div className="min-h-[250px]">
                    {renderStep()}
                </div>

                <button
                    onClick={nextStep}
                    disabled={isNextDisabled || isLoading}
                    className="w-full mt-8 px-4 py-3 bg-primary-start text-white rounded-lg font-semibold hover:bg-primary-start/80 transition-colors disabled:opacity-50 flex items-center justify-center h-[51px]"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (step === 'theme' ? 'Finish Setup' : 'Continue')}
                </button>
                 {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
            </motion.div>
        </div>
    );
};