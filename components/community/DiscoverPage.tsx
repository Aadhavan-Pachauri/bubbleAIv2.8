
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UsersIcon, MagnifyingGlassIcon, UserPlusIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Profile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { searchUsers, sendFriendRequest, getFriendships, getOutgoingFriendRequests } from '../../services/databaseService';
import { useToast } from '../../hooks/useToast';

const CreatorCard: React.FC<{ 
    profile: Profile; 
    friendStatus: 'none' | 'pending' | 'friend' | 'self'; 
    onAddFriend: (id: string) => void; 
}> = ({ profile, friendStatus, onAddFriend }) => {
    
    let actionButton;
    if (friendStatus === 'self') {
        actionButton = (
            <button disabled className="mt-4 w-full px-4 py-2 text-sm font-semibold bg-white/5 text-gray-400 rounded-lg cursor-default border border-white/10">
                You
            </button>
        );
    } else if (friendStatus === 'friend') {
        actionButton = (
            <button disabled className="mt-4 w-full px-4 py-2 text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg flex items-center justify-center gap-2 cursor-default">
                <CheckIcon className="w-4 h-4" /> Friends
            </button>
        );
    } else if (friendStatus === 'pending') {
        actionButton = (
            <button disabled className="mt-4 w-full px-4 py-2 text-sm font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg flex items-center justify-center gap-2 cursor-default">
                <ClockIcon className="w-4 h-4" /> Pending
            </button>
        );
    } else {
        actionButton = (
             <button 
                onClick={() => onAddFriend(profile.id)}
                className="mt-4 w-full px-4 py-2 text-sm font-semibold bg-primary-start text-white rounded-lg hover:bg-primary-start/80 transition-colors flex items-center justify-center gap-2"
            >
                <UserPlusIcon className="w-4 h-4" /> Add Friend
            </button>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-secondary rounded-xl p-4 border border-bg-tertiary flex flex-col items-center text-center transition-colors hover:border-primary-start"
        >
            <img 
                src={profile.avatar_url || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Cpath d='M50 42 C61.046 42 70 50.954 70 62 L30 62 C30 50.954 38.954 42 50 42 Z' fill='white'/%3E%3Ccircle cx='50' cy='30' r='10' fill='white'/%3E%3C/svg%3E`} 
                alt={profile.roblox_username} 
                className="w-24 h-24 rounded-full mb-4 object-cover bg-bg-tertiary" 
            />
            <div className="w-full px-1">
                <h3 
                    className="font-bold text-white text-lg truncate w-full" 
                    title={profile.roblox_username}
                >
                    {profile.roblox_username}
                </h3>
                {profile.email && (
                    <div className="w-full" title={profile.email}>
                        <p className="text-xs text-gray-500 truncate w-full mb-1">
                            {profile.email}
                        </p>
                    </div>
                )}
                <p className="text-sm text-primary-start capitalize font-semibold">{profile.membership}</p>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex-grow line-clamp-2 h-8 w-full px-2">
                {profile.bio || `An enthusiastic creator exploring Bubble AI.`}
            </p>
            {actionButton}
        </motion.div>
    );
};

export const DiscoverPage: React.FC = () => {
    const { user, supabase } = useAuth();
    const { addToast } = useToast();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

    // Load initial friends/requests state
    useEffect(() => {
        if (!user) return;
        const fetchSocialState = async () => {
            try {
                const friends = await getFriendships(supabase, user.id);
                const pending = await getOutgoingFriendRequests(supabase, user.id);
                
                setFriendIds(new Set(friends.map(f => f.other_user.id)));
                setPendingIds(new Set(pending.map(p => p.friend_id)));
            } catch (e) {
                console.error(e);
            }
        };
        fetchSocialState();
    }, [user, supabase]);

    // Handle Search
    useEffect(() => {
        const doSearch = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // If query is empty, fetch random/recent users? 
                // For now, defaulting to a generic search if empty to show *someone*
                const query = searchQuery.trim() || 'a'; 
                const users = await searchUsers(supabase, query, user.id); 
                setResults(users);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        
        const delayDebounceFn = setTimeout(() => {
            doSearch();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, user, supabase]);

    const handleAddFriend = async (targetId: string) => {
        if (!user) return;
        try {
            await sendFriendRequest(supabase, user.id, targetId);
            addToast('Friend request sent!', 'success');
            setPendingIds(prev => new Set(prev).add(targetId));
        } catch (e: any) {
            addToast(e.message || 'Failed to send request.', 'error');
        }
    };

    const getStatus = (profileId: string) => {
        if (profileId === user?.id) return 'self';
        if (friendIds.has(profileId)) return 'friend';
        if (pendingIds.has(profileId)) return 'pending';
        return 'none';
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white">Discover Creators</h1>
                <p className="text-gray-400 mt-1">Find and connect with other talented developers.</p>
            </header>

            <div className="sticky top-0 bg-bg-primary/80 backdrop-blur-sm z-10 py-4 mb-6">
                <div className="relative max-w-md mx-auto">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search for creators..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-bg-secondary/50 border border-bg-tertiary rounded-full pl-12 pr-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-start"
                    />
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center py-20">
                    <svg className="animate-spin h-8 w-8 text-primary-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {results.map(profile => (
                        <CreatorCard 
                            key={profile.id} 
                            profile={profile} 
                            friendStatus={getStatus(profile.id)}
                            onAddFriend={handleAddFriend}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-semibold">No creators found</p>
                    <p className="text-sm">Try a different search term.</p>
                </div>
            )}
        </div>
    );
};
