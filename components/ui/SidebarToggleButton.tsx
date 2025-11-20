
import React from 'react';
import { ChevronDoubleLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface SidebarToggleButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({ isCollapsed, onToggle }) => {
  return (
    <motion.button
      onClick={onToggle}
      className="p-1.5 text-gray-400 rounded-md hover:bg-white/10 hover:text-white transition-colors"
      title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      // FIX: framer-motion props wrapped in a spread object to bypass type errors.
      {...{
        animate: { rotate: isCollapsed ? 180 : 0 },
        transition: { duration: 0.3 },
      }}
    >
      <ChevronDoubleLeftIcon className="w-5 h-5" />
    </motion.button>
  );
};
