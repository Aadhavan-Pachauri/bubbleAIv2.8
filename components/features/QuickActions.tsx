import React from 'react';
import { MagnifyingGlassIcon, PhotoIcon, CodeBracketIcon, BeakerIcon } from '@heroicons/react/24/outline';

// Quick action buttons for common tasks
export const QuickActions: React.FC<{onAction: (prompt: string) => void}> = ({ onAction }) => {
  const actions = [
    { icon: <MagnifyingGlassIcon className="w-5 h-5"/>, label: 'Search', prompt: 'Search for the latest AI news' },
    { icon: <PhotoIcon className="w-5 h-5"/>, label: 'Generate Image', prompt: 'Generate an image of a futuristic city' },
    { icon: <CodeBracketIcon className="w-5 h-5"/>, label: 'Write Code', prompt: 'Write a python script to parse a CSV file' },
    { icon: <BeakerIcon className="w-5 h-5"/>, label: 'Research', prompt: 'Do a deep research analysis on quantum computing' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          className="flex flex-col items-center text-center gap-2 px-3 py-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => onAction(action.prompt)}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-start/20 text-primary-start">
            {action.icon}
          </div>
          <span className="text-sm font-medium text-gray-200">{action.label}</span>
        </button>
      ))}
    </div>
  );
};