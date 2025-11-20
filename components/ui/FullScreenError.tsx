
import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface FullScreenErrorProps {
    title: string;
    message: string;
    onRetry?: () => void;
}

export const FullScreenError: React.FC<FullScreenErrorProps> = ({ title, message, onRetry }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-bg-primary text-white p-4">
            <div className="w-full max-w-md p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-center">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-error mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                <p className="text-gray-400 mb-6">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary-start text-white rounded-lg shadow-lg hover:bg-primary-start/80 transition-all duration-150 ease-in-out"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        <span>Try Again</span>
                    </button>
                )}
            </div>
        </div>
    );
};
