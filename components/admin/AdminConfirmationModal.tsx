

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ModalConfig {
    title: string;
    message: string;
    confirmText: string;
    confirmClassName: string;
    needsReasonInput?: boolean;
    initialReason?: string | null;
}

interface AdminConfirmationModalProps {
    isOpen: boolean;
    config: ModalConfig | null;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
}

export const AdminConfirmationModal: React.FC<AdminConfirmationModalProps> = ({
    isOpen,
    config,
    onClose,
    onConfirm,
}) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen && config?.needsReasonInput) {
            setReason(config.initialReason || '');
        } else {
            setReason('');
        }
    }, [isOpen, config]);

    if (!config) return null;

    const handleConfirm = () => {
        onConfirm(config.needsReasonInput ? reason : undefined);
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
                        className="w-full max-w-md p-6 bg-bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-500/10">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">{config.title}</h3>
                                <p className="mt-2 text-sm text-gray-400">{config.message}</p>
                            </div>
                        </div>

                        {config.needsReasonInput && (
                            <div className="mt-4">
                                <label htmlFor="ban-reason" className="block text-sm font-medium text-gray-300">
                                    Reason
                                </label>
                                <textarea
                                    id="ban-reason"
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="mt-1 block w-full bg-white/5 border border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-start transition-colors p-2 text-sm"
                                    placeholder="Provide a reason for this action..."
                                />
                            </div>
                        )}

                        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-2 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 bg-transparent text-base font-medium text-gray-300 hover:bg-white/10 focus:outline-none sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:w-auto sm:text-sm ${config.confirmClassName}`}
                            >
                                {config.confirmText}
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};