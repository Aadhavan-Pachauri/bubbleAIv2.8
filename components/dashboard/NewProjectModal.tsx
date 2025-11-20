
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import { ProjectPlatform, ProjectType } from '../../types';
import { ComputerDesktopIcon, FilmIcon, PaintBrushIcon, BookOpenIcon, ChartPieIcon, DocumentTextIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, platform: ProjectPlatform, projectType: ProjectType) => Promise<void>;
  onSwitchToAutonomous: () => void;
  isAdmin?: boolean;
}

const CubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9.75v9.75" />
    </svg>
);

const projectTypeOptions: { id: ProjectType; name: string; icon: React.ReactElement; platform: ProjectPlatform }[] = [
    { id: 'roblox_game', name: 'Roblox Game', icon: <CubeIcon className="w-8 h-8"/>, platform: 'Roblox Studio' },
    { id: 'website', name: 'Website/App', icon: <ComputerDesktopIcon className="w-8 h-8"/>, platform: 'Web App' },
    { id: 'video', name: 'Video/Movie', icon: <FilmIcon className="w-8 h-8"/>, platform: 'Web App' },
    { id: 'story', name: 'Story/Novel', icon: <BookOpenIcon className="w-8 h-8"/>, platform: 'Web App' },
    { id: 'design', name: 'Design/Image', icon: <PaintBrushIcon className="w-8 h-8"/>, platform: 'Web App' },
    { id: 'presentation', name: 'Presentation', icon: <ChartPieIcon className="w-8 h-8"/>, platform: 'Web App' },
    { id: 'document', name: 'Document', icon: <DocumentTextIcon className="w-8 h-8"/>, platform: 'Web App' },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreateProject, onSwitchToAutonomous, isAdmin = false }) => {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('roblox_game');
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen) {
        setStep(1);
        setProjectName('');
        setProjectType('roblox_game');
        setIsCreating(false);
        setCreationError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!projectName.trim() || !projectType || isCreating) return;

    const selectedOption = projectTypeOptions.find(p => p.id === projectType);
    if (!selectedOption) return;

    setIsCreating(true);
    setCreationError(null);
    try {
      await onCreateProject(projectName, selectedOption.platform, projectType);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setCreationError(`Failed to create project. Please try again. (Error: ${errorMessage})`);
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Create New Project</h2>
            <p className="text-gray-400 mb-6 text-center">How would you like to start?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                onClick={onSwitchToAutonomous}
                className="p-6 border-2 border-white/20 hover:border-primary-start/50 bg-white/5 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer text-center"
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  whileHover: { scale: 1.03 },
                  whileTap: { scale: 0.98 },
                }}
              >
                  <SparklesIcon className="w-10 h-10 text-primary-start" />
                  <h3 className="font-bold text-white text-lg">Autonomous</h3>
                  <p className="text-sm text-gray-400">Describe your idea, and the AI will generate the project for you.</p>
              </motion.div>
              <motion.div
                onClick={() => setStep(2)}
                className="p-6 border-2 border-white/20 hover:border-primary-start/50 bg-white/5 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer text-center"
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  whileHover: { scale: 1.03 },
                  whileTap: { scale: 0.98 },
                }}
              >
                  <UserGroupIcon className="w-10 h-10 text-primary-start" />
                  <h3 className="font-bold text-white text-lg">Co-Creator</h3>
                  <p className="text-sm text-gray-400">You guide the AI step-by-step in a collaborative workspace.</p>
              </motion.div>
            </div>
             <p className="text-center text-sm text-gray-500 mt-6">Or, start from a pre-built project by visiting the <button className="underline hover:text-primary-start">Community Marketplace</button>.</p>
          </div>
        );
      case 2:
       return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Setup Co-Creator Project</h2>
            <p className="text-gray-400 mb-6">Choose a project type to open the right workspace.</p>
            <div className="mb-4">
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., My Awesome Obby"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-start transition-colors"
                required
                autoFocus
              />
          </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {projectTypeOptions.map(option => (
                    <div
                        key={option.id}
                        onClick={() => setProjectType(option.id)}
                        className={`p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center ${projectType === option.id ? 'border-primary-start bg-primary-start/10' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
                    >
                       <div className="text-primary-start">{option.icon}</div>
                       <h3 className="font-semibold text-white text-xs">{option.name}</h3>
                    </div>
                ))}
            </div>
             {creationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg flex items-start gap-3 my-4">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                    <p>{creationError}</p>
                </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isCreating || !projectName.trim()}
              className="w-full h-[51px] flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-start/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Create Project'}
            </button>
        </div>
       )
    }
  }

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
            className="w-full max-w-2xl p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
            </button>
            {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="absolute top-4 left-4 p-2 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                    <ChevronLeftIcon className="w-4 h-4" />
                    Back
                </button>
            )}
            
            <AnimatePresence mode="wait">
                <motion.div
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      key: step,
                      initial: { opacity: 0, x: 50 },
                      animate: { opacity: 1, x: 0 },
                      exit: { opacity: 0, x: -50 },
                      transition: { duration: 0.2 },
                    }}
                >
                    {renderStepContent()}
                </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
