import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftOnRectangleIcon,
    CheckCircleIcon,
    KeyIcon,
    UserCircleIcon,
    CreditCardIcon,
    PaintBrushIcon,
    BeakerIcon,
    CpuChipIcon,
    CurrencyDollarIcon,
    WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { validateApiKey } from '../../services/geminiService';
import { MemoryDashboard } from '../settings/MemoryDashboard';
import { BillingSettings } from '../settings/BillingSettings';
import { ModelPreferences } from '../settings/ModelPreferences';
import { useToast } from '../../hooks/useToast';

type SettingsTab = 'profile' | 'account' | 'appearance' | 'memory' | 'apiKeys' | 'billing' | 'models';

const GoogleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
        s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
        s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
        C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
        c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238
        C43.021,36.251,44,30.686,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const RobloxLogo = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.14,3.23l-3.88,1.25l1.2,3.71l3.89,-1.25l-1.21,-3.71M12,2A2,2 0 0,0 10.23,3.77L6.34,15.03L2.91,16.2A2,2 0 0,0 1.25,18.25L4.8,20.94A2,2 0 0,0 6.85,21.36L18.1,17.47L21.53,16.3A2,2 0 0,0 23.19,14.25L19.64,11.56A2,2 0 0,0 17.59,11.14L6.34,15.03L9.77,3.8A2,2 0 0,0 8.11,1.75L4.56,4.44A2,2 0 0,0 2.5,4A2,2 0 0,0 2.08,5.88L5.5,17.1L4.8,20.94L18.1,17.47L12.14,3.23Z" />
    </svg>
);

const FALLBACK_AVATAR_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Cpath d='M50 42 C61.046 42 70 50.954 70 62 L30 62 C30 50.954 38.954 42 50 42 Z' fill='white'/%3E%3Ccircle cx='50' cy='30' r='10' fill='white'/%3E%3C/svg%3E`;


const Section: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({ title, children, description }) => (
    <div>
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        <div className="w-16 border-b-2 border-primary-start mt-2 mb-6"></div>
        {description && <p className="text-text-secondary mb-6 max-w-2xl">{description}</p>}
        <div className="space-y-6">{children}</div>
    </div>
);

const SectionCard: React.FC<{children: React.ReactNode}> = ({children}) => (
    <div className="p-6 bg-bg-secondary/50 rounded-xl border border-border-color">{children}</div>
);

// Settings Content Components
const ProfileContent: React.FC = () => {
    const { profile, updateUserProfile } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (profile) setDisplayName(profile.roblox_username || '');
    }, [profile]);

    const handleSaveProfile = async () => {
        if (!displayName.trim() || displayName === profile?.roblox_username || isSaving) return;
        setIsSaving(true);
        try {
            await updateUserProfile({ roblox_username: displayName.trim() });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) { console.error(error); } finally { setIsSaving(false); }
    };
    
    return (
        <Section title="Public profile">
             <SectionCard>
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1">
                        <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-1">Display Name</label>
                        <p className="text-xs text-text-secondary mb-2">This name will be displayed throughout the application.</p>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 dark:bg-black/20 border border-border-color rounded-md focus:outline-none focus:ring-1 focus:ring-primary-start text-text-primary"
                        />
                    </div>
                     <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Profile Picture</label>
                         <img src={profile?.avatar_url || FALLBACK_AVATAR_SVG} alt="Avatar" className="w-24 h-24 rounded-full bg-bg-tertiary" />
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border-color flex justify-end">
                    <button
                        onClick={handleSaveProfile}
                        disabled={isSaving || saveSuccess || !displayName.trim() || displayName === profile?.roblox_username}
                        className="px-5 h-[38px] bg-primary-start text-white rounded-md font-semibold text-sm hover:bg-primary-start/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-24 flex items-center justify-center"
                    >
                        {isSaving ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        : saveSuccess ? <CheckCircleIcon className="h-6 w-6 text-white" />
                        : 'Save'}
                    </button>
                </div>
            </SectionCard>
        </Section>
    )
}

const AccountContent: React.FC = () => {
    const { user, providers, signOut, signInWithGoogle } = useAuth();
    const isEmailPasswordUser = user?.app_metadata.provider === 'email';
    
    const providerDetails = [
        { name: 'google', Icon: GoogleIcon, isLinked: providers.includes('google'), action: signInWithGoogle, label: 'Google' },
        { name: 'roblox', Icon: RobloxLogo, isLinked: providers.includes('roblox'), action: () => alert("Roblox linking coming soon!"), label: 'Roblox' },
    ];
    return (
        <Section title="Account" description="Manage your linked accounts and session information.">
            <SectionCard>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Linked Accounts</h3>
                 <div className="space-y-3">
                    {isEmailPasswordUser && (
                         <div className="flex items-center justify-between p-3 bg-black/20 rounded-md">
                            <div className="flex items-center gap-4">
                                <UserCircleIcon className="w-6 h-6 text-text-secondary" />
                                <span className="font-medium text-text-primary">Email & Password</span>
                            </div>
                            <span className="text-sm text-success font-semibold px-3 py-1 bg-success/10 rounded-md">Primary</span>
                        </div>
                    )}
                    {providerDetails.map(({ name, Icon, isLinked, action, label }) => (
                        <div key={name} className="flex items-center justify-between p-3 bg-black/20 rounded-md">
                            <div className="flex items-center gap-4">
                                <Icon />
                                <span className="font-medium text-text-primary">{label}</span>
                                 {name === 'roblox' && !isLinked && (
                                    <span className="text-[10px] font-bold text-cyan-300 bg-cyan-900/50 px-1.5 py-0.5 rounded">SOON</span>
                                )}
                            </div>
                            {isLinked ? <span className="text-sm text-success font-semibold px-3 py-1 bg-success/10 rounded-md">Linked</span>
                            : <button onClick={action} disabled={name === 'roblox'} className="px-4 py-1.5 text-sm font-semibold bg-white/10 text-text-primary rounded-md hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">Link Account</button>}
                        </div>
                    ))}
                </div>
            </SectionCard>
             <SectionCard>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Logout</h3>
                <p className="text-sm text-text-secondary mb-4">This will log you out of your account on this browser.</p>
                <button
                    onClick={signOut}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-error/20 text-error hover:bg-error/40 hover:text-red-300 rounded-lg transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5"/>
                    <span>Logout</span>
                </button>
            </SectionCard>
        </Section>
    )
}

const ApiKeysContent: React.FC = () => {
    const { geminiApiKey, saveGeminiApiKey } = useAuth();
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [keyToUpdate, setKeyToUpdate] = useState('');
    const [isUpdatingKey, setIsUpdatingKey] = useState(false);
    const [keyUpdateSuccess, setKeyUpdateSuccess] = useState(false);
    const [keyUpdateError, setKeyUpdateError] = useState<string | null>(null);

    const handleUpdateKey = async () => {
        if (!keyToUpdate.trim() || isUpdatingKey) return;
        setIsUpdatingKey(true); setKeyUpdateError(null); setKeyUpdateSuccess(false);
        try {
            const { success, message } = await validateApiKey(keyToUpdate);
            if (!success) {
                throw new Error(message || "The new API key appears to be invalid.");
            }
            await saveGeminiApiKey(keyToUpdate);
            setKeyUpdateSuccess(true);
            setKeyToUpdate('');
            setTimeout(() => setKeyUpdateSuccess(false), 2000);
        } catch (error) {
            const msg = (error instanceof Error) ? error.message : "An unknown error occurred.";
            setKeyUpdateError(msg);
        } finally { setIsUpdatingKey(false); }
    };
    
    const copyApiKey = () => geminiApiKey && navigator.clipboard.writeText(geminiApiKey);
    const maskedApiKey = geminiApiKey ? (isKeyVisible ? geminiApiKey : `sk-....${geminiApiKey.slice(-4)}`) : 'Not Set';
    
    return (
        <Section title="API Keys" description="Manage your API keys for third-party services like Google Gemini.">
            <SectionCard>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-400/10 rounded-md"><KeyIcon className="w-6 h-6 text-yellow-400"/></div>
                        <div>
                            <p className="font-medium text-text-primary">Google Gemini API Key</p>
                            <p className="font-mono text-sm text-text-secondary">{maskedApiKey}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="px-3 py-1.5 text-xs font-semibold bg-white/10 dark:bg-black/20 text-text-primary rounded-md hover:bg-interactive-hover">
                            {isKeyVisible ? 'Hide' : 'Show'}
                        </button>
                        <button onClick={copyApiKey} disabled={!geminiApiKey} className="px-3 py-1.5 text-xs font-semibold bg-white/10 dark:bg-black/20 text-text-primary rounded-md hover:bg-interactive-hover disabled:opacity-50">
                            Copy
                        </button>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border-color">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Update API Key</label>
                    <p className="text-xs text-text-secondary mb-2">Enter a new key to replace the current one.</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="password"
                            placeholder="Enter new Gemini API key"
                            value={keyToUpdate}
                            onChange={(e) => { setKeyToUpdate(e.target.value); setKeyUpdateError(null); }}
                            className="flex-grow px-3 py-2 bg-white/5 dark:bg-black/20 border border-border-color rounded-md focus:outline-none focus:ring-1 focus:ring-primary-start text-text-primary"
                        />
                        <button
                            onClick={handleUpdateKey}
                            disabled={isUpdatingKey || keyUpdateSuccess || !keyToUpdate.trim()}
                            className="self-end px-4 h-[42px] bg-primary-start text-white rounded-md font-semibold text-sm hover:bg-primary-start/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-24 flex items-center justify-center"
                        >
                            {isUpdatingKey ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            : keyUpdateSuccess ? <CheckCircleIcon className="h-6 w-6 text-white" />
                            : 'Save'}
                        </button>
                    </div>
                    {keyUpdateError && <p className="text-red-400 text-xs mt-2">{keyUpdateError}</p>}
                </div>
            </SectionCard>
        </Section>
    )
}

const AppearanceContent: React.FC = () => {
    const { profile, updateUserProfile } = useAuth();
    const { addToast } = useToast();
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            setTheme(profile.ui_theme || 'auto');
        }
    }, [profile]);

    const handleSave = async () => {
        if (!profile || isSaving) return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            await updateUserProfile({ ui_theme: theme });
            setSaveSuccess(true);
            addToast("Theme preference saved!", "success");
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            addToast("Failed to save theme preference.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = (profile?.ui_theme || 'auto') !== theme;

    return (
        <Section title="Appearance" description="Customize the look and feel of the application.">
            <SectionCard>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Theme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${theme === 'light' ? 'border-primary-start' : 'border-border-color hover:border-gray-300 dark:hover:border-gray-500'}`}
                    >
                        <span className="font-semibold text-text-primary">Light</span>
                        <p className="text-sm text-text-secondary">A bright, clean interface.</p>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${theme === 'dark' ? 'border-primary-start' : 'border-border-color hover:border-gray-300 dark:hover:border-gray-500'}`}
                    >
                        <span className="font-semibold text-text-primary">Dark</span>
                        <p className="text-sm text-text-secondary">Easier on the eyes in low light.</p>
                    </button>
                     <button
                        onClick={() => setTheme('auto')}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${theme === 'auto' ? 'border-primary-start' : 'border-border-color hover:border-gray-300 dark:hover:border-gray-500'}`}
                    >
                        <span className="font-semibold text-text-primary">Auto</span>
                        <p className="text-sm text-text-secondary">Syncs with your system's theme.</p>
                    </button>
                </div>
                <div className="mt-6 pt-6 border-t border-border-color flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || saveSuccess || !hasChanges}
                        className="px-6 h-[42px] bg-primary-start text-white rounded-md font-semibold text-sm hover:bg-primary-start/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-32 flex items-center justify-center"
                    >
                        {isSaving ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        : saveSuccess ? <CheckCircleIcon className="h-6 w-6 text-white" />
                        : 'Save Changes'}
                    </button>
                </div>
            </SectionCard>
        </Section>
    );
}


export const SettingsPage: React.FC<{onBack: () => void}> = ({ onBack }) => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    const navItems = [
        { id: 'profile', label: 'Public profile', icon: UserCircleIcon },
        { id: 'account', label: 'Account', icon: CreditCardIcon },
        { id: 'billing', label: 'Billing & Usage', icon: CurrencyDollarIcon },
        { id: 'models', label: 'Model Preferences', icon: WrenchScrewdriverIcon },
        { id: 'apiKeys', label: 'API Keys', icon: KeyIcon },
        { id: 'memory', label: 'Memory', icon: CpuChipIcon },
        { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    ] as const;

    const renderContent = () => {
        switch(activeTab) {
            case 'profile': return <ProfileContent />;
            case 'account': return <AccountContent />;
            case 'billing': return <BillingSettings />;
            case 'models': return <ModelPreferences />;
            case 'apiKeys': return <ApiKeysContent />;
            case 'memory': return <MemoryDashboard />;
            case 'appearance': return <AppearanceContent />;
            default: return null;
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-bg-primary"> {/* Full height minus TopBar */}
            <aside className="w-64 flex-shrink-0 p-6 border-r border-border-color overflow-y-auto bg-bg-secondary">
                <div className="flex items-center gap-3 mb-6">
                    <img src={profile?.avatar_url || FALLBACK_AVATAR_SVG} alt="Avatar" className="w-10 h-10 rounded-full bg-bg-tertiary" />
                    <div>
                        <p className="font-bold text-text-primary truncate">{profile?.roblox_username}</p>
                        <p className="text-xs text-text-secondary">Personal account</p>
                    </div>
                </div>
                <nav>
                    <ul>
                        {navItems.map(item => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left ${
                                        activeTab === item.id ? 'bg-black/10 dark:bg-white/10 text-text-primary font-semibold' : 'text-text-secondary hover:bg-interactive-hover hover:text-text-primary'
                                    }`}
                                >
                                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-text-primary' : 'text-text-secondary'}`} />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                 <AnimatePresence mode="wait">
                    <motion.div
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          key: activeTab,
                          initial: { opacity: 0, x: 20 },
                          animate: { opacity: 1, x: 0 },
                          exit: { opacity: 0, x: -20 },
                          transition: { duration: 0.2 },
                        }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};