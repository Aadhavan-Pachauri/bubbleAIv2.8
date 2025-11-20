
import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, Cog6ToothIcon, Bars3Icon, BuildingStorefrontIcon, ChatBubbleBottomCenterTextIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { UserDropdown } from './UserDropdown';
import { WorkspaceMode } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onSearchQueryChange }) => {
    return (
        <div className="relative w-48 md:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="bg-bg-secondary/50 border border-bg-tertiary rounded-lg pl-10 pr-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-start"
            />
            {searchQuery && (
                <button onClick={() => onSearchQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

type HubView = 'projects' | 'marketplace' | 'messages' | 'discover';

interface TopBarProps {
  onGoToHub: () => void;
  onAccountSettingsClick: () => void;
  onProjectSettingsClick: () => void;
  onLogout: () => void;
  activeProjectName: string | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  workspaceMode: WorkspaceMode;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
  isProjectView: boolean;
  onHamburgerClick: () => void;
  showHamburger: boolean;
  isThinking?: boolean;
  onSwitchToAutonomous: () => void;
  onSwitchToCocreator: () => void;
  hubView: HubView;
  onHubViewChange: (view: HubView) => void;
  loadingMessage: string;
  hamburgerId?: string;
}

const FALLBACK_AVATAR_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Cpath d='M50 42 C61.046 42 70 50.954 70 62 L30 62 C30 50.954 38.954 42 50 42 Z' fill='white'/%3E%3Ccircle cx='50' cy='30' r='10' fill='white'/%3E%3C/svg%3E`;

// Dummy CubeIcon for HubNavigation
const CubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9.75v9.75" />
    </svg>
);

const HubNavigation: React.FC<{ hubView: HubView, onHubViewChange: (view: HubView) => void }> = ({ hubView, onHubViewChange }) => {
    const navItems = [
        { id: 'projects' as HubView, label: 'My Projects', icon: <CubeIcon className="w-5 h-5" /> },
        { id: 'marketplace' as HubView, label: 'Marketplace', icon: <BuildingStorefrontIcon className="w-5 h-5" /> },
        { id: 'messages' as HubView, label: 'Messages', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> },
        { id: 'discover' as HubView, label: 'Discover', icon: <UsersIcon className="w-5 h-5" /> },
    ];
    
    return (
        <div className="flex items-center gap-2 p-1 bg-black/20 rounded-lg">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onHubViewChange(item.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${hubView === item.id ? 'bg-interactive-hover text-text-primary' : 'text-text-secondary hover:bg-interactive-hover hover:text-text-primary'}`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export const TopBar: React.FC<TopBarProps> = ({ 
    onGoToHub, 
    onAccountSettingsClick, 
    onProjectSettingsClick,
    onLogout,
    activeProjectName,
    searchQuery,
    onSearchQueryChange,
    workspaceMode,
    onWorkspaceModeChange,
    isProjectView,
    onHamburgerClick,
    showHamburger,
    isThinking = false,
    onSwitchToAutonomous,
    onSwitchToCocreator,
    hubView,
    onHubViewChange,
    loadingMessage,
    hamburgerId
}) => {
  const { profile, user, loading } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isHubDropdownOpen, setHubDropdownOpen] = useState(false);
  const hubDropdownRef = useRef<HTMLDivElement>(null);
  
  const displayName = profile?.roblox_username || user?.email || 'User';
  const avatarUrl = profile?.avatar_url;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (hubDropdownRef.current && !hubDropdownRef.current.contains(event.target as Node)) {
        setHubDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
    const hubNavItems = [
        { id: 'projects' as HubView, label: 'My Projects', icon: <CubeIcon className="w-5 h-5" /> },
        { id: 'marketplace' as HubView, label: 'Marketplace', icon: <BuildingStorefrontIcon className="w-5 h-5" /> },
        { id: 'messages' as HubView, label: 'Messages', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> },
        { id: 'discover' as HubView, label: 'Discover', icon: <UsersIcon className="w-5 h-5" /> },
    ];
    
    const currentHubItem = hubNavItems.find(item => item.id === hubView);

  return (
    <header className="relative flex-shrink-0 h-16 flex items-center justify-between px-4 md:px-8 bg-bg-primary">
      <div className="flex items-center gap-2 md:gap-4 flex-shrink min-w-0">
        {showHamburger && (
            <button id={hamburgerId} onClick={onHamburgerClick} className="p-1 text-text-secondary hover:text-text-primary" aria-label="Open menu">
                <Bars3Icon className="w-6 h-6" />
            </button>
        )}
        <button onClick={onGoToHub} className="flex items-center space-x-2.5 transition-transform hover:scale-105" title="Go to Co-Creator Hub">
            <span className="text-2xl">🫧</span>
            <span className="hidden sm:inline text-xl font-bold tracking-wider text-text-primary">Bubble</span>
        </button>
        
        {!isProjectView && workspaceMode === 'cocreator' && (
            <>
              {/* Desktop Hub Nav */}
              <div className="hidden lg:block">
                <HubNavigation hubView={hubView} onHubViewChange={onHubViewChange} />
              </div>
              {/* Mobile Hub Dropdown */}
              <div className="relative lg:hidden ml-2" ref={hubDropdownRef}>
                  <button
                      onClick={() => setHubDropdownOpen(p => !p)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-bg-tertiary text-text-primary"
                  >
                      {currentHubItem?.icon}
                      <span className="hidden sm:inline">{currentHubItem?.label}</span>
                      <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                      {isHubDropdownOpen && (
                          <motion.div 
                            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                            {...{
                              initial: { opacity: 0, y: -10 },
                              animate: { opacity: 1, y: 0 },
                              exit: { opacity: 0, y: -10 },
                            }}
                            className="absolute left-0 top-full mt-2 w-56 bg-bg-secondary/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 p-2"
                          >
                              {hubNavItems.map(item => (
                                  <button
                                      key={item.id}
                                      onClick={() => { onHubViewChange(item.id); setHubDropdownOpen(false); }}
                                      className={`w-full flex items-center gap-3 p-2 text-left rounded-md transition-colors ${hubView === item.id ? 'bg-interactive-hover text-text-primary' : 'text-text-secondary hover:bg-interactive-hover'}`}
                                  >
                                      {item.icon}
                                      <span>{item.label}</span>
                                  </button>
                              ))}
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
            </>
        )}
        
        {isProjectView && activeProjectName && (
            <>
                <div className="h-6 w-px bg-border-color hidden sm:block"></div>
                <div className="hidden sm:flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-text-primary truncate">{activeProjectName}</span>
                    <button onClick={onProjectSettingsClick} className="p-1.5 text-text-secondary rounded-md hover:bg-interactive-hover hover:text-text-primary transition-colors flex-shrink-0">
                        <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                </div>
            </>
        )}
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {isProjectView && activeProjectName && (
            <SearchBar
                searchQuery={searchQuery}
                onSearchQueryChange={onSearchQueryChange}
            />
        )}
        
         <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(prev => !prev)} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-white/10 transition-colors">
                {loading ? (
                    <div className="w-9 h-9 rounded-full bg-bg-tertiary animate-pulse"></div>
                ) : (
                    <img 
                        src={avatarUrl || FALLBACK_AVATAR_SVG} 
                        alt="User Avatar"
                        className="w-9 h-9 rounded-full object-cover bg-bg-tertiary"
                    />
                )}
                 <div className="hidden sm:block">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate max-w-[120px] text-left">{displayName}</p>
                        {profile?.membership === 'admin' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-start/20 text-primary-start rounded uppercase tracking-wider">
                                Admin
                            </span>
                        )}
                    </div>
                 </div>
            </button>
             <UserDropdown 
                isOpen={isDropdownOpen}
                onClose={() => setDropdownOpen(false)}
                onSettingsClick={onAccountSettingsClick}
                onLogout={onLogout}
                onSwitchToAutonomous={onSwitchToAutonomous}
                onSwitchToCocreator={onSwitchToCocreator}
            />
        </div>
      </div>
    </header>
  );
};
