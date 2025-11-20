
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface CanvasModalProps {
    code: string;
    onClose: () => void;
}

export const CanvasModal: React.FC<CanvasModalProps> = ({ code, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-6xl h-[85vh] bg-bg-secondary rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-bg-tertiary">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Canvas Preview
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 bg-white">
                     <iframe
                        srcDoc={code}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                        title="Canvas Preview"
                    />
                </div>
            </motion.div>
        </div>
    );
};
