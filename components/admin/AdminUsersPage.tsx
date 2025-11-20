
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllProfiles, getProjects, updateProfileForAdmin, deleteUser } from '../../services/databaseService';
import { Profile, Project } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminConfirmationModal } from './AdminConfirmationModal';
import { useToast } from '../../hooks/useToast';
import {
    ArrowRightOnRectangleIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    XMarkIcon,
    ArrowPathIcon,
    EllipsisVerticalIcon,
    TrashIcon,
    ShieldCheckIcon,
    NoSymbolIcon,
    EyeIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';


const FALLBACK_AVATAR_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Cpath d='M50 42 C61.046 42 70 50.954 70 62 L30 62 C30 50.954 38.954 42 50 42 Z' fill='white'/%3E%3Ccircle cx='50' cy='30' r='10' fill='white'/%3E%3C/svg%3E`;

type ActionType = 'view_key' | 'promote_working' | 'promote_show' | 'demote_user' | 'ban' | 'unban' | 'delete';

// User Details Modal Component
const Stat: React.FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-200 break-all">{value || 'N/A'}</dd>
    </div>
);

const AdminUserDetailsModal: React.FC<{ profile: Profile | null; onClose: () => void }> = ({ profile, onClose }) => {
    const { supabase } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            const fetchUserData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const userProjects = await getProjects(supabase, profile.id);
                    setProjects(userProjects);
                } catch (err) {
                    setError('Failed to load user projects.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUserData();
        }
    }, [profile, supabase]);

    if (!profile) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/50 backdrop-blur-md">
                <motion.div
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { scale: 0.9, opacity: 0, y: 20 },
                      animate: { scale: 1, opacity: 1, y: 0 },
                      exit: { scale: 0.9, opacity: 0, y: 20 },
                      transition: { type: 'spring', stiffness: 260, damping: 20 },
                    }}
                    className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
                >
                    <header className="flex-shrink-0 p-6 flex justify-between items-center border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <img src={profile.avatar_url || FALLBACK_AVATAR_SVG} alt="Avatar" className="w-12 h-12 rounded-full bg-bg-tertiary" />
                            <div>
                                <h2 className="text-xl font-bold text-white">{profile.roblox_username}</h2>
                                <p className="text-sm text-gray-400">User Details</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </header>
                    
                    <main className="flex-1 p-6 overflow-y-auto space-y-6">
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                            <div className="p-4 bg-black/20 rounded-lg">
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <Stat label="Display Name" value={profile.roblox_username} />
                                    <Stat label="Email" value={profile.email} />
                                    <Stat label="User ID" value={profile.id} />
                                    <Stat label="Avatar URL" value={profile.avatar_url} />
                                    <Stat label="API Key Set" value={profile.gemini_api_key ? 'Yes' : 'No'} />
                                    <Stat label="Membership" value={profile.membership} />
                                    <Stat label="Role" value={profile.role} />
                                    <Stat label="Status" value={profile.status} />
                                    {profile.banned_until && <Stat label="Banned Until" value={new Date(profile.banned_until).toLocaleString()} />}
                                </dl>
                            </div>
                        </section>
                        
                        <section>
                             <h3 className="text-lg font-semibold text-white mb-4">User Projects ({projects.length})</h3>
                             <div className="p-4 bg-black/20 rounded-lg">
                                {isLoading ? (
                                    <div className="text-center text-gray-400">Loading projects...</div>
                                ) : error ? (
                                    <div className="text-center text-red-400 flex items-center justify-center gap-2">
                                        <ExclamationTriangleIcon className="w-5 h-5" /> {error}
                                    </div>
                                ) : projects.length > 0 ? (
                                    <ul className="space-y-3">
                                        {projects.map(p => (
                                            <li key={p.id} className="p-3 bg-bg-tertiary rounded-md border border-white/10">
                                                <p className="font-semibold text-white">{p.name}</p>
                                                <p className="text-sm text-gray-400 line-clamp-1">{p.description}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center text-gray-500">This user has not created any projects.</div>
                                )}
                             </div>
                        </section>
                    </main>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Ban User Modal
const BanUserModal: React.FC<{ isOpen: boolean; onClose: () => void; onBan: (duration: string, reason: string) => void }> = ({ isOpen, onClose, onBan }) => {
    const [duration, setDuration] = useState('permanent');
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onBan(duration, reason);
        setDuration('permanent');
        setReason('');
        onClose();
    };

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
                        className="w-full max-w-md p-6 bg-bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative"
                    >
                         <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-500/10">
                                <NoSymbolIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Ban User</h3>
                                <p className="text-sm text-gray-400">Select the duration and reason for banning this user.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
                                <select 
                                    value={duration} 
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full p-2 bg-white/5 border border-white/20 rounded-md text-white"
                                >
                                    <option value="permanent">Permanent</option>
                                    <option value="24h">24 Hours</option>
                                    <option value="7d">7 Days</option>
                                    <option value="30d">30 Days</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Reason (Optional)</label>
                                <textarea 
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Violation of terms..."
                                    className="w-full p-2 bg-white/5 border border-white/20 rounded-md text-white h-24 resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Confirm Ban</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


const UserActionMenu: React.FC<{ profile: Profile; onAction: (action: ActionType) => void }> = ({ profile, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isWorkingAdmin = profile.role === 'admin';
    const isShowAdmin = profile.role !== 'admin' && profile.membership === 'admin';

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          initial: { opacity: 0, scale: 0.95, y: 10 },
                          animate: { opacity: 1, scale: 1, y: 0 },
                          exit: { opacity: 0, scale: 0.95, y: 10 },
                          transition: { duration: 0.1 },
                        }}
                        className="absolute right-0 mt-2 w-56 bg-bg-tertiary/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden"
                    >
                        <button onClick={(e) => { e.stopPropagation(); onAction('view_key'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                            <KeyIcon className="w-4 h-4" /> View API Key
                        </button>
                        
                        {!isWorkingAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); onAction('promote_working'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                <WrenchScrewdriverIcon className="w-4 h-4 text-green-400" /> Promote to Working Admin
                            </button>
                        )}

                        {!isShowAdmin && !isWorkingAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); onAction('promote_show'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                <EyeIcon className="w-4 h-4 text-blue-400" /> Make Show Admin
                            </button>
                        )}
                        
                        {(isWorkingAdmin || isShowAdmin) && (
                            <button onClick={(e) => { e.stopPropagation(); onAction('demote_user'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-yellow-400" /> Demote to User
                            </button>
                        )}

                        {profile.status !== 'banned' ? (
                            <button onClick={(e) => { e.stopPropagation(); onAction('ban'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                <NoSymbolIcon className="w-4 h-4 text-orange-400" /> Ban User
                            </button>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onAction('unban'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-green-400" /> Unban User
                            </button>
                        )}
                        
                        <button onClick={(e) => { e.stopPropagation(); onAction('delete'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5">
                            <TrashIcon className="w-4 h-4" /> Delete User
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// User Card Component
const UserCard: React.FC<{ profile: Profile; onRequestAction: (actionType: ActionType, profile: Profile) => void; onViewDetails: (profile: Profile) => void; }> = ({ profile, onRequestAction, onViewDetails }) => {
    const { impersonateUser } = useAuth();
    
    const isWorkingAdmin = profile.role === 'admin';
    // Show admin logic: Has admin membership but is technically a 'user' role (no access to dashboard)
    const isShowAdmin = profile.role !== 'admin' && profile.membership === 'admin';

    return (
        <motion.div
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              layout: true,
              initial: { opacity: 0, y: 20, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: -20, scale: 0.95 },
              transition: { type: 'spring', stiffness: 300, damping: 25 },
            }}
            className={`bg-bg-secondary rounded-xl p-4 border border-bg-tertiary flex flex-col transition-all duration-300 cursor-pointer hover:border-primary-start relative group`}
            onClick={() => onViewDetails(profile)}
        >
            <div className="absolute top-4 right-4 z-10">
                 <UserActionMenu profile={profile} onAction={(action) => onRequestAction(action, profile)} />
            </div>

            <div className="flex items-start gap-4 mb-4">
                <img
                    src={profile.avatar_url || FALLBACK_AVATAR_SVG}
                    alt={`${profile.roblox_username}'s avatar`}
                    className="w-16 h-16 rounded-full object-cover bg-bg-tertiary flex-shrink-0"
                />
                <div className="overflow-hidden flex-1 pr-6">
                    <h3 className="text-lg font-bold text-white truncate">{profile.roblox_username}</h3>
                    {profile.email && (
                        <p className="text-xs text-gray-400 truncate mb-1">{profile.email}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {(isWorkingAdmin || isShowAdmin) ? (
                             <span className="px-2 py-0.5 rounded-full font-semibold bg-primary-start/20 text-primary-start border border-primary-start/30">ADMIN</span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                profile.membership === 'max' ? 'bg-purple-500/20 text-purple-400' :
                                profile.membership === 'pro' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                                {profile.membership.toUpperCase()}
                            </span>
                        )}

                        {profile.status === 'banned' && (
                            <span className="px-2 py-0.5 rounded-full font-semibold bg-orange-500/20 text-orange-400">BANNED</span>
                        )}
                        <span className="text-gray-500 truncate" title={profile.id}>
                            ID: {profile.id.split('-')[0]}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-auto grid grid-cols-1 gap-2 text-xs font-semibold">
                <button
                    onClick={(e) => { e.stopPropagation(); impersonateUser(profile); }}
                    title="Impersonate User"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 bg-white/5 text-gray-300 rounded-md hover:bg-white/10 hover:text-white transition-colors"
                >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>View As User</span>
                </button>
            </div>
        </motion.div>
    );
};

export const AdminUsersPage: React.FC = () => {
    const { supabase, user } = useAuth();
    const { addToast } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<any>(null);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [userToBan, setUserToBan] = useState<Profile | null>(null);


    const fetchProfiles = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const data = await getAllProfiles(supabase);
            setProfiles(data);
        } catch (err) {
            setError('Failed to fetch user profiles.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchProfiles();
        
        const channel = supabase
            .channel('profiles-realtime-admin')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => fetchProfiles()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchProfiles]);

    const handleRequestAction = (actionType: ActionType, profile: Profile) => {
        setSelectedProfile(profile);
        switch (actionType) {
            case 'view_key':
                setModalConfig({
                    title: `${profile.roblox_username}'s API Key`,
                    message: profile.gemini_api_key || 'No key has been set for this user.',
                    confirmText: 'Copy to Clipboard',
                    confirmClassName: 'bg-indigo-600 text-white hover:bg-indigo-700',
                    needsReasonInput: false,
                });
                setIsModalOpen(true);
                break;
            case 'promote_working':
                setModalConfig({
                    title: `Promote to Working Admin?`,
                    message: "This user will gain FULL access to the Admin Dashboard, Database Controls, and User Management.",
                    confirmText: "Promote to Working Admin",
                    confirmClassName: 'bg-red-600 text-white hover:bg-red-700',
                    action: 'promote_working'
                });
                setIsModalOpen(true);
                break;
            case 'promote_show':
                setModalConfig({
                    title: `Make Show Admin?`,
                    message: "This user will get the 'Admin' badge and unlimited credits, but NO access to the Admin Dashboard.",
                    confirmText: "Make Show Admin",
                    confirmClassName: 'bg-blue-600 text-white hover:bg-blue-700',
                    action: 'promote_show'
                });
                setIsModalOpen(true);
                break;
            case 'demote_user':
                setModalConfig({
                    title: `Demote to User?`,
                    message: "This user will lose all admin privileges and be returned to a standard 'NA' membership.",
                    confirmText: "Demote",
                    confirmClassName: 'bg-yellow-600 text-white hover:bg-yellow-700',
                    action: 'demote_user'
                });
                setIsModalOpen(true);
                break;
            case 'delete':
                setModalConfig({
                    title: `Delete ${profile.roblox_username}?`,
                    message: "This action is permanent. All user data, projects, and chats will be wiped.",
                    confirmText: "Delete User",
                    confirmClassName: 'bg-red-600 text-white hover:bg-red-700',
                    action: 'delete'
                });
                setIsModalOpen(true);
                break;
            case 'ban':
                setUserToBan(profile);
                setIsBanModalOpen(true);
                break;
            case 'unban':
                setModalConfig({
                    title: `Unban ${profile.roblox_username}?`,
                    message: "This user will regain access to their account immediately.",
                    confirmText: "Unban User",
                    confirmClassName: 'bg-green-600 text-white hover:bg-green-700',
                    action: 'unban'
                });
                setIsModalOpen(true);
                break;
        }
    };

    const handleConfirmAction = async (reason?: string) => {
        if (!selectedProfile || !modalConfig) return;

        try {
            if (modalConfig.title.includes('API Key')) {
                if (selectedProfile.gemini_api_key) {
                    navigator.clipboard.writeText(selectedProfile.gemini_api_key);
                    addToast("API Key copied to clipboard", "success");
                }
            } else if (modalConfig.action === 'promote_working') {
                // Working Admin: Role=admin, Membership=admin
                await updateProfileForAdmin(supabase, selectedProfile.id, { role: 'admin', membership: 'admin' });
                addToast(`${selectedProfile.roblox_username} promoted to Working Admin`, "success");
            } else if (modalConfig.action === 'promote_show') {
                // Show Admin: Role=user, Membership=admin
                await updateProfileForAdmin(supabase, selectedProfile.id, { role: 'user', membership: 'admin' });
                addToast(`${selectedProfile.roblox_username} set to Show Admin`, "success");
            } else if (modalConfig.action === 'demote_user') {
                // Demote to User: Role=user, Membership=na
                await updateProfileForAdmin(supabase, selectedProfile.id, { role: 'user', membership: 'na' });
                addToast(`${selectedProfile.roblox_username} demoted to standard user`, "success");
            } else if (modalConfig.action === 'delete') {
                await deleteUser(supabase, selectedProfile.id);
                setProfiles(prev => prev.filter(p => p.id !== selectedProfile.id));
                addToast(`${selectedProfile.roblox_username} deleted`, "success");
            } else if (modalConfig.action === 'unban') {
                await updateProfileForAdmin(supabase, selectedProfile.id, { status: 'active', banned_until: null });
                addToast(`${selectedProfile.roblox_username} unbanned`, "success");
            }
        } catch (error) {
            console.error(error);
            addToast("Action failed. Ensure you are a Working Admin.", "error");
        } finally {
            setIsModalOpen(false);
            setSelectedProfile(null);
            setModalConfig(null);
            fetchProfiles(); // Refresh list to show changes
        }
    };

    const handleBanUser = async (duration: string, reason: string) => {
        if (!userToBan) return;
        try {
            let bannedUntil = null;
            if (duration !== 'permanent') {
                const now = new Date();
                if (duration === '24h') now.setHours(now.getHours() + 24);
                if (duration === '7d') now.setDate(now.getDate() + 7);
                if (duration === '30d') now.setDate(now.getDate() + 30);
                bannedUntil = now.toISOString();
            }

            await updateProfileForAdmin(supabase, userToBan.id, { status: 'banned', banned_until: bannedUntil });
            addToast(`${userToBan.roblox_username} has been banned.`, "success");
            fetchProfiles();
        } catch (error) {
            console.error(error);
            addToast("Failed to ban user.", "error");
        } finally {
            setIsBanModalOpen(false);
            setUserToBan(null);
        }
    };
    
    const filteredProfiles = useMemo(() => {
        // Filter out current user to prevent accidental self-demotion via UI
        let result = user ? profiles.filter(p => p.id !== user.id) : profiles;

        if (!searchQuery) return result;
        
        return result.filter(p =>
            p.roblox_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [profiles, searchQuery, user]);


    if (isLoading) {
        return (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-bg-secondary rounded-xl p-4 border border-bg-tertiary animate-pulse">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-bg-tertiary"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-6 w-3/4 bg-bg-tertiary rounded"></div>
                                <div className="h-4 w-1/2 bg-bg-tertiary rounded"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="h-9 bg-bg-tertiary rounded-md"></div>
                            <div className="h-9 bg-bg-tertiary rounded-md"></div>
                        </div>
                    </div>
                 ))}
             </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ExclamationTriangleIcon className="w-12 h-12 text-error mb-4" />
                <h2 className="text-xl font-semibold text-white">An Error Occurred</h2>
                <p className="text-gray-400 mb-4">{error}</p>
                <button onClick={fetchProfiles} className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors">
                    Try Again
                </button>
            </div>
        );
    }
    
    return (
        <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        All Users
                        <button 
                            onClick={fetchProfiles} 
                            disabled={isRefreshing}
                            className={`p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                            title="Refresh list"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    </h1>
                    <p className="text-gray-400 mt-1">{profiles.length} registered profiles</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-bg-secondary/50 border border-bg-tertiary rounded-lg pl-10 pr-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-start"
                    />
                </div>
            </div>
            
            <AnimatePresence>
                {filteredProfiles.length > 0 ? (
                    <motion.div
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          layout: true,
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredProfiles.map(profile => (
                            <UserCard 
                                key={profile.id} 
                                profile={profile} 
                                onRequestAction={handleRequestAction} 
                                onViewDetails={setViewingProfile}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          initial: { opacity: 0, y: 10 },
                          animate: { opacity: 1, y: 0 },
                        }}
                        className="text-center py-16"
                    >
                        <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white">No Users Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mt-2">
                            {searchQuery 
                                ? `Your search for "${searchQuery}" did not match any profiles.` 
                                : "No user profiles were found in the database."}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AdminConfirmationModal
                isOpen={isModalOpen}
                config={modalConfig}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAction}
            />

            <BanUserModal 
                isOpen={isBanModalOpen}
                onClose={() => setIsBanModalOpen(false)}
                onBan={handleBanUser}
            />

            <AdminUserDetailsModal 
                profile={viewingProfile}
                onClose={() => setViewingProfile(null)}
            />
        </div>
    );
};
