
import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { WorkspaceMode } from '../../types';

interface WorkspaceModeSelectorProps {
  workspaceMode: WorkspaceMode;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
}

const modes = [
    { id: 'autonomous' as WorkspaceMode, name: 'Autonomous', icon: SparklesIcon },
    { id: 'cocreator' as WorkspaceMode, name: 'Co-Creator', icon: ComputerDesktopIcon },
];

export const WorkspaceModeSelector: React.FC<WorkspaceModeSelectorProps> = ({ workspaceMode, onWorkspaceModeChange }) => {
    return (
        <div className="relative p-1 bg-black/20 backdrop-blur-sm border border-white/10 rounded-full flex items-center">
            {modes.map(mode => (
                <button
                    key={mode.id}
                    onClick={() => onWorkspaceModeChange(mode.id)}
                    className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                        workspaceMode === mode.id ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    {workspaceMode === mode.id && (
                        <motion.div
                            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                            {...{
                              layoutId: "workspaceModeIndicator",
                              transition: { type: 'spring', stiffness: 300, damping: 25 },
                            }}
                            className="absolute inset-0 bg-white/10 rounded-full"
                        />
                    )}
                    <mode.icon className="w-5 h-5 relative" />
                    <span className="relative">{mode.name}</span>
                </button>
            ))}
        </div>
    );
};
