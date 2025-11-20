
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../types';
import { PuzzlePieceIcon } from '@heroicons/react/24/solid';
import { EllipsisVerticalIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const statusColors: { [key in Project['status']]: string } = {
    'In Progress': 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    'Archived': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project);
    setIsMenuOpen(false);
  };

  return (
    <motion.div
      onClick={() => onSelect(project)}
      className="group relative cursor-pointer bg-bg-secondary rounded-xl p-5 border border-bg-tertiary hover:border-primary-start transition-all duration-200 flex flex-col"
      // FIX: framer-motion props wrapped in a spread object to bypass type errors.
      {...{
        whileHover: { scale: 1.02, y: -4 },
        whileTap: { scale: 0.98 },
      }}
    >
      <div className="absolute top-3 right-3" ref={menuRef}>
          <button
              onClick={handleMenuToggle}
              className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
              <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
          <AnimatePresence>
              {isMenuOpen && (
                  <motion.div
                      // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                      {...{
                        initial: { opacity: 0, scale: 0.95, y: -10 },
                        animate: { opacity: 1, scale: 1, y: 0 },
                        exit: { opacity: 0, scale: 0.95, y: -10 },
                        transition: { duration: 0.1 },
                      }}
                      className="absolute right-0 mt-1 w-48 bg-bg-tertiary/90 backdrop-blur-lg border border-border-color rounded-lg shadow-2xl z-20 p-1.5"
                  >
                      <button
                          onClick={handleDeleteClick}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      >
                          <TrashIcon className="w-5 h-5" />
                          <span>Delete Project</span>
                      </button>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center">
            <PuzzlePieceIcon className="w-7 h-7 text-gray-400" />
        </div>
        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[project.status]} self-start mr-8`}>
            {project.status}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
        <p className="text-sm text-gray-400 h-10 line-clamp-2">{project.description}</p>
      </div>

      <div className="border-t border-bg-tertiary mt-4 pt-4 flex justify-between items-center text-xs text-gray-500">
        <span>Modified {timeAgo(project.updated_at)}</span>
      </div>
    </motion.div>
  );
};
