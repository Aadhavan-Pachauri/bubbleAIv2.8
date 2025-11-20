

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, ChatBubbleLeftEllipsisIcon, SparklesIcon, CpuChipIcon, PuzzlePieceIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import { ChatMode } from '../../types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (name: string, mode: ChatMode) => Promise<void>;
  existingChatCount: number;
  isAdmin: boolean;
}

interface AgentModeInfo {
    id: ChatMode;
    name: string;
    description: string;
    // FIX: Changed JSX.Element to React.ReactElement to resolve namespace error.
    icon: React.ReactElement;
    disabled?: boolean;
}

// FIX: Changed type to AgentModeInfo[] to allow access to optional 'disabled' property.
const agentModes: AgentModeInfo[] = [
    {
      id: 'chat',
      name: 'Bubble Chat',
      description: 'For conversational chat and quick questions.',
      icon: <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-white" />,
    },
    {
      id: 'plan',
      name: 'Bubble Memory',
      description: "Create and update the project's long-term memory.",
      icon: <AcademicCapIcon className="w-6 h-6 text-white" />,
    },
    {
      id: 'build',
      name: 'Bubble Build',
      description: 'Generate step-by-step build plans from memory.',
      icon: <SparklesIcon className="w-6 h-6 text-white" />,
    },
    {
      id: 'thinker',
      name: 'Bubble Thinker',
      description: 'Get multiple perspectives on a problem.',
      icon: <CpuChipIcon className="w-6 h-6 text-white" />,
    },
    {
      id: 'super_agent',
      name: 'Bubble Max',
      description: 'An advanced agent for complex, multi-step tasks.',
      icon: <PuzzlePieceIcon className="w-6 h-6 text-white" />,
    },
];

const proMaxAgent: AgentModeInfo = {
    id: 'pro_max',
    name: 'Bubble Pro Max',
    description: 'Developer-only agent for expert-level architecture.',
    icon: <AcademicCapIcon className="w-6 h-6 text-white" />,
}


export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreateChat, existingChatCount, isAdmin }) => {
  const [chatName, setChatName] = useState('');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('chat');
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  
  const availableModes = isAdmin ? [...agentModes, proMaxAgent] : agentModes;
  
  useEffect(() => {
    if (isOpen) {
        setChatName(`Chat ${existingChatCount + 1}`);
        setSelectedMode('chat');
        setIsCreating(false);
        setCreationError(null);
    }
  }, [isOpen, existingChatCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatName.trim() || !selectedMode || isCreating) return;

    setIsCreating(true);
    setCreationError(null);
    try {
      await onCreateChat(chatName, selectedMode);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setCreationError(`Failed to create chat. Please try again. (Error: ${errorMessage})`);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/50 backdrop-blur-md">
          <motion.div
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              initial: { scale: 0.9, opacity: 0, y: 20 },
              animate: { scale: 1, opacity: 1, y: 0 },
              exit: { scale: 0.9, opacity: 0, y: 20 },
              transition: { type: 'spring', stiffness: 260, damping: 20 },
            }}
            className="w-full max-w-lg p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">New Chat</h2>
            <p className="text-gray-400 mb-6">Start a new conversation with a specific AI agent.</p>
            
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="chatName" className="block text-sm font-medium text-gray-300 mb-2">Chat Name</label>
                    <input
                      type="text"
                      id="chatName"
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      placeholder="e.g., Inventory System"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-start transition-colors"
                      required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agent Mode</label>
                    <div className="space-y-3">
                        {availableModes.map(mode => (
                            <div 
                                key={mode.id}
                                onClick={() => !mode.disabled && setSelectedMode(mode.id)}
                                className={`p-3 border-2 rounded-lg flex items-start gap-4 transition-colors ${
                                    selectedMode === mode.id ? 'border-primary-start bg-primary-start/10' : 'border-white/20 bg-white/5'
                                } ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/40'}`}
                            >
                                <div className={`mt-1 flex-shrink-0 ${mode.disabled ? 'text-gray-500' : ''}`}>{mode.icon}</div>
                                <div>
                                    <h3 className={`font-semibold ${mode.disabled ? 'text-gray-400' : 'text-white'}`}>{mode.name} {mode.disabled && '(Coming Soon)'}</h3>
                                    <p className="text-sm text-gray-400">{mode.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {creationError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg flex items-start gap-3 my-4">
                        <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                        <p>{creationError}</p>
                    </div>
                )}

                <button
                  type="submit"
                  disabled={!chatName.trim() || !selectedMode || isCreating}
                  className="w-full h-[51px] flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-start/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                  ) : 'Start Chat'}
                </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
