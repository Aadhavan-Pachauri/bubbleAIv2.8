

import React, { createContext, useState, useEffect, useContext } from 'react';
import type { Session, User, SupabaseClient, Provider } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase } from '../supabaseClient'; // Import the centralized client
import { createProfile as createProfileInDb, updateProfile } from '../services/databaseService';
import { useToast } from '../hooks/useToast';

// --- Development Flag ---
// Set to true to bypass login and use mock data.
// Set to false for normal authentication flow.
const DEV_BYPASS_LOGIN = false;

interface AuthContextType {
    supabase: SupabaseClient;
    session: Session | null;
    user: User | null;
    profile: Profile | null | undefined; // Can be undefined during initial load
    profileError: string | null;
    providers: string[];
    loading: boolean;
    geminiApiKey: string | null;
    isAdmin: boolean;
    isImpersonating: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithRoblox: () => Promise<void>; // Kept for future use
    signInWithPassword: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    saveGeminiApiKey: (key: string) => Promise<void>;
    setGeminiApiKey: (key: string | null) => void;
    createProfile: (displayName: string) => Promise<void>;
    updateUserProfile: (updates: Partial<Profile>, fetchAfter?: boolean) => Promise<void>;
    loginAsAdmin: () => void;
    logoutAdmin: () => void;
    impersonateUser: (profileToImpersonate: Profile) => void;
    stopImpersonating: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { addToast } = useToast();
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [providers, setProviders] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [originalAdminState, setOriginalAdminState] = useState<{ session: Session; user: User; profile: Profile } | null>(null);

    // This effect runs once when the profile is loaded to award daily credits.
    useEffect(() => {
        const awardDailyCredits = async () => {
            if (!profile || !supabase || DEV_BYPASS_LOGIN) return;

            const today = new Date().toISOString().split('T')[0];
            const lastAwardDate = profile.last_credit_award_date ? new Date(profile.last_credit_award_date).toISOString().split('T')[0] : null;

            if (lastAwardDate !== today) {
                try {
                    const { data: settings, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
                    // If settings table is missing or empty, we can't award credits.
                    if (error) {
                         // Silent fail on settings fetch error to avoid blocking the app
                         return;
                    }
                    if (!settings) return;

                    const dailyAward = settings[`daily_credits_${profile.membership}`] || 0;
                    
                    if (dailyAward > 0) {
                        const newCreditTotal = (profile.credits || 0) + dailyAward;
                        
                        const { data: updatedProfileData, error: updateError } = await supabase
                            .from('profiles')
                            .update({ credits: newCreditTotal, last_credit_award_date: new Date().toISOString() })
                            .eq('id', profile.id)
                            .select()
                            .single();
                        
                        if (updateError) {
                             // Catch P0001 specifically for unauthorized credit updates (RLS policy)
                             if (updateError.code === 'P0001' || updateError.code === '42501') {
                                 // Silently ignore RLS errors for credits to avoid user confusion
                                 return;
                             }
                             throw updateError;
                        }

                        setProfile(updatedProfileData);
                        addToast(`You received your ${dailyAward} daily credits!`, 'success');
                    }
                } catch (err) {
                    // Don't log P0001 errors even if they slip through
                    if ((err as any)?.code !== 'P0001') {
                        const msg = err instanceof Error ? err.message : JSON.stringify(err);
                        console.error("Failed to award daily credits:", msg);
                    }
                }
            }
        };

        awardDailyCredits();
    }, [profile?.id]); // Reruns only when the user's profile ID changes (i.e., on login)

    // This effect manages the application's theme based on user preference.
    useEffect(() => {
        const root = document.documentElement;
        const theme = profile?.ui_theme;

        const applyTheme = (t: 'light' | 'dark') => {
            if (t === 'light') {
                root.classList.remove('dark');
            } else {
                root.classList.add('dark');
            }
            // After changing the class, re-initialize Mermaid to pick up the new CSS variables.
            setTimeout(() => {
                if ((window as any).initializeMermaidTheme) {
                    (window as any).initializeMermaidTheme();
                }
            }, 50);
        };

        if (theme === 'light' || theme === 'dark') {
            applyTheme(theme);
            return; // No listener needed
        } 
        
        // Handle 'auto' or undefined
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
        
        const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);

    }, [profile?.ui_theme]);


    useEffect(() => {
        if (DEV_BYPASS_LOGIN) {
            // Mock data for development
            const mockUser: User = { id: '11111111-1111-1111-1111-111111111111', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { name: 'Dev User' }, aud: 'authenticated', created_at: new Date().toISOString(), email: 'dev@example.com' };
            const mockSession: Session = { access_token: 'mock-token', token_type: 'bearer', user: mockUser, refresh_token: 'mock-refresh', expires_in: 3600 };
            setSession(mockSession);
            setUser(mockUser);
            setProfile({ id: mockUser.id, roblox_id: 'mock', roblox_username: 'Dev User', avatar_url: '', credits: 1000, membership: 'admin', preferred_chat_model: 'gemini_2.5_flash', preferred_image_model: 'nano_banana' });
            setGeminiApiKey('DUMMY_API_KEY_FOR_DEVELOPMENT');
            setLoading(false);
            return;
        }

        const resolveUserSession = async (currentSession: Session | null) => {
            if (originalAdminState) { setLoading(false); return; }

            setSession(currentSession);
            const currentUser = currentSession?.user ?? null;
            setUser(currentUser);
            setProviders(currentUser?.identities?.map(i => i.provider as string) ?? []);

            let userIsAdmin = false;

            if (currentUser) {
                try {
                    const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                    if (error && error.code !== 'PGRST116') throw error;
                    
                    // If database says they are admin, grant admin access
                    if (profileData) {
                        if (profileData.role === 'admin') {
                            userIsAdmin = true;
                        } else {
                            // Strict enforcement: If DB says user, they are user.
                            // Clear any stale session flag to prevent "demoted but still admin" issue.
                            sessionStorage.removeItem('isAdmin');
                            userIsAdmin = false;
                        }
                    }

                    setProfile(profileData);
                    setGeminiApiKey(profileData?.gemini_api_key || null);
                    setProfileError(null);
                } catch (error: any) {
                    const errorMessage = error?.message || 'An unknown error occurred.';
                    console.error("Error fetching profile:", errorMessage, { originalError: error });
                    setProfileError("Could not load your profile. Please check your internet connection and any ad-blockers, then try again.");
                    setProfile(null);
                }
            } else {
                setProfile(null);
                setGeminiApiKey(null);
                userIsAdmin = false;
            }
            setIsAdmin(userIsAdmin);
            setLoading(false);
        };

        setLoading(true);
        supabase.auth.getSession().then(({ data: { session } }) => resolveUserSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setLoading(true);
            resolveUserSession(session);
        });

        return () => subscription.unsubscribe();
    }, [originalAdminState]);

    const signInWithProvider = async (provider: Provider) => {
        await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    };
    const signInWithGoogle = () => signInWithProvider('google');
    const signInWithRoblox = () => signInWithProvider('roblox' as Provider);
    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };
    const signUpWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    };
    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
             redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
    }
    const signOut = async () => {
        if (!DEV_BYPASS_LOGIN) await supabase.auth.signOut();
        setSession(null); setUser(null); setProfile(null); setProviders([]); setGeminiApiKey(null);
        if (isAdmin) logoutAdmin();
    };
    const saveGeminiApiKey = async (key: string) => {
        if (!user) throw new Error("User not authenticated.");
        await updateProfile(supabase, user.id, { gemini_api_key: key });
        setGeminiApiKey(key);
    };
    const createProfile = async (displayName: string) => {
        if (!user) throw new Error("User not authenticated.");
        setLoading(true);
        try {
            const newProfile = await createProfileInDb(supabase, user.id, displayName, user.user_metadata.avatar_url || '');
            setProfile(newProfile);
        } finally { setLoading(false); }
    };
    const updateUserProfile = async (updates: Partial<Profile>, fetchAfter: boolean = true) => {
        if (!user) throw new Error("User not authenticated.");
        const updatedProfile = await updateProfile(supabase, user.id, updates);
        if (fetchAfter) {
            setProfile(prev => ({ ...(prev || {}), ...updatedProfile }));
        }
    };
    const loginAsAdmin = () => { sessionStorage.setItem('isAdmin', 'true'); setIsAdmin(true); };
    const logoutAdmin = () => { sessionStorage.removeItem('isAdmin'); setIsAdmin(false); };
    const impersonateUser = (profileToImpersonate: Profile) => {
        if (!isAdmin || !session || !user || !profile) return;
        setOriginalAdminState({ session, user, profile });
        const impersonatedUser: User = { ...user, id: profileToImpersonate.id, email: `impersonating@bubble.ai`, user_metadata: { ...user.user_metadata, name: profileToImpersonate.roblox_username, avatar_url: profileToImpersonate.avatar_url }};
        const impersonatedSession: Session = { ...session, user: impersonatedUser };
        setSession(impersonatedSession); setUser(impersonatedUser); setProfile(profileToImpersonate); setGeminiApiKey(profileToImpersonate.gemini_api_key || null); setIsAdmin(false);
    };
    const stopImpersonating = () => {
        if (!originalAdminState) return;
        setSession(originalAdminState.session); setUser(originalAdminState.user); setProfile(originalAdminState.profile); setGeminiApiKey(originalAdminState.profile.gemini_api_key || null); setOriginalAdminState(null); setIsAdmin(true);
    };

    const value: AuthContextType = { supabase, session, user, profile, profileError, providers, loading, geminiApiKey, isAdmin, isImpersonating: originalAdminState !== null, signInWithGoogle, signInWithRoblox, signInWithPassword, signUpWithEmail, resetPassword, signOut, saveGeminiApiKey, setGeminiApiKey, createProfile, updateUserProfile, loginAsAdmin, logoutAdmin, impersonateUser, stopImpersonating };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};