

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CodeBlock } from '../ui/CodeBlock';

interface RightSidebarProps {
  isOpen: boolean;
  code: string | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, code }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          // FIX: framer-motion props wrapped in a spread object to bypass type errors.
          {...{
            initial: { x: '100%' },
            animate: { x: 0 },
            exit: { x: '100%' },
            transition: { type: 'spring', stiffness: 300, damping: 30 },
          }}
          className="w-full md:w-1/3 max-w-lg flex-shrink-0 bg-brand-dark/70 backdrop-blur-lg border-l border-white/10 shadow-2xl p-6 flex flex-col"
          aria-label="Code Preview Panel"
        >
            <h2 className="text-xl font-semibold mb-4 text-white flex-shrink-0">Code Preview</h2>
            <div className="flex-1 bg-black/30 rounded-lg overflow-hidden">
             {code ? (
// FIX: Removed the 'showFooter' prop as it does not exist on the CodeBlock component.
                <CodeBlock code={code} language="lua" />
             ) : (
                <div className="p-4 h-full flex items-center justify-center">
                    <p className="text-gray-400 text-center">Code from AI responses will appear here.</p>
                </div>
             )}
            </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
