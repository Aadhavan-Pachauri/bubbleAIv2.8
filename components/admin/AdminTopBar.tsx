

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserDropdown } from '../dashboard/UserDropdown';
import { WorkspaceMode } from '../../types';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type AdminView = 'projects' | 'users' | 'settings' | 'personal-settings' | 'credit-system' | 'marketplace' | 'messages' | 'discover';

interface AdminTopBarProps {
    currentView: AdminView;
    setView: (view: AdminView) => void;
    workspaceMode: WorkspaceMode;
    onWorkspaceModeChange: (mode: WorkspaceMode) => void;
    onHamburgerClick: () => void;
    showHamburger: boolean;
    isThinking?: boolean;
    onSwitchToAutonomous: () => void;
    onSwitchToCocreator: () => void;
    onAccountSettingsClick: () => void;
    onSignOut: () => void;
    loadingMessage: string;
}

const FALLBACK_AVATAR_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Cpath d='M50 42 C61.046 42 70 50.954 70 62 L30 62 C30 50.954 38.954 42 50 42 Z' fill='white'/%3E%3Ccircle cx='50' cy='30' r='10' fill='white'/%3E%3C/svg%3E`;

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ 
    currentView, 
    setView, 
    workspaceMode, 
    onWorkspaceModeChange, 
    onHamburgerClick, 
    showHamburger,
    isThinking = false,
    onSwitchToAutonomous,
    onSwitchToCocreator,
    onAccountSettingsClick,
    onSignOut,
    loadingMessage,
}) => {
  const { profile, loading } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isNavOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const navItemClasses = "px-3 py-2 text-sm font-medium rounded-md transition-colors";
  const activeClasses = "bg-white/10 text-white";
  const inactiveClasses = "text-gray-400 hover:bg-white/5 hover:text-white";

  const displayName = profile?.roblox_username || 'Admin';
  const avatarUrl = profile?.avatar_url;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setNavOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const navItems = [
    { id: 'projects' as AdminView, label: 'Projects' },
    { id: 'users' as AdminView, label: 'Users' },
    { id: 'marketplace' as AdminView, label: 'Marketplace' },
    { id: 'messages' as AdminView, label: 'Messages' },
    { id: 'discover' as AdminView, label: 'Discover' },
    { id: 'settings' as AdminView, label: 'App Settings' },
  ];
  const currentNavItem = navItems.find(item => item.id === currentView);

  if (workspaceMode === 'autonomous') {
    return (
      <header className="relative flex-shrink-0 h-16 flex items-center justify-between md:justify-center px-4 md:px-8 border-b border-border-color bg-bg-primary">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {showHamburger && (
              <button onClick={onHamburgerClick} className="p-2 text-gray-400 hover:text-white" aria-label="Open menu">
                  <Bars3Icon className="w-6 h-6" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {isThinking ? (
                <>
                    <svg className="animate-spin h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{loadingMessage}</span>
                </>
            ) : (
                <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>{loadingMessage}</span>
                </>
            )}
          </div>
      </header>
    );
  }

  return (
    <header className="relative flex-shrink-0 h-16 flex items-center justify-between px-4 md:px-8 border-b border-border-color bg-bg-primary">
      <div className="flex items-center gap-3 md:gap-6">
        {showHamburger && (
            <button onClick={onHamburgerClick} className="p-1 text-gray-400 hover:text-white" aria-label="Open menu">
                <Bars3Icon className="w-6 h-6" />
            </button>
        )}
        
        <button onClick={onSwitchToCocreator} className="flex items-center gap-3 transition-transform hover:scale-105" title="Go to Admin Hub">
            <span className="text-2xl">🫧</span>
            <span className="hidden sm:inline text-xl font-bold tracking-wider text-white">Bubble (Admin)</span>
        </button>
        
        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-2 p-1 bg-black/20 rounded-lg">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`${navItemClasses} ${currentView === item.id ? activeClasses : inactiveClasses}`}
                >
                    {item.label}
                </button>
            ))}
        </div>
        
        {/* Mobile Dropdown */}
        <div className="relative lg:hidden" ref={navRef}>
            <button
                onClick={() => setNavOpen(p => !p)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-black/20 text-white"
            >
                <span>{currentNavItem?.label || 'Menu'}</span>
                <ChevronDownIcon className="w-4 h-4" />
            </button>
            <AnimatePresence>
                {isNavOpen && (
                    <motion.div
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          initial: { opacity: 0, y: -10 },
                          animate: { opacity: 1, y: 0 },
                          exit: { opacity: 0, y: -10 },
                        }}
                        className="absolute left-0 top-full mt-2 w-48 bg-bg-secondary/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 p-2"
                    >
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setView(item.id); setNavOpen(false); }}
                                className={`w-full text-left ${navItemClasses} ${currentView === item.id ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(prev => !prev)} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-white/10 transition-colors">
              {loading ? (
                  <div className="w-9 h-9 rounded-full bg-bg-tertiary animate-pulse"></div>
              ) : (
                  <img 
                      src={avatarUrl || FALLBACK_AVATAR_SVG} 
                      alt="Admin Avatar"
                      className="w-9 h-9 rounded-full object-cover bg-bg-tertiary"
                  />
              )}
              <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-white truncate max-w-[120px] text-left">{displayName}</p>
                  <p className="text-xs text-gray-500">Admin Profile</p>
              </div>
          </button>
          <UserDropdown
              isOpen={isDropdownOpen}
              onClose={() => setDropdownOpen(false)}
              isAdminView={true}
              onSettingsClick={onAccountSettingsClick}
              onLogout={onSignOut}
              onSwitchToAutonomous={onSwitchToAutonomous}
              onSwitchToCocreator={onSwitchToCocreator}
          />
      </div>
    </header>
  );
};