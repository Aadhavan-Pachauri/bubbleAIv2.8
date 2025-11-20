
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { importService } from '../../services/importService';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ImportWizardProps {
  userId: string;
  isOpen: boolean;
  onComplete: (project: any) => void;
  onClose: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ userId, isOpen, onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!platform || !file || !projectName) return;
    
    setImporting(true);
    setError(null);
    try {
      const result = await importService.importProject({
        platform: platform as any,
        file,
        projectName,
        userId
      });
      
      onComplete(result);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred."
      setError(`Import failed: ${message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
      setStep(1);
      setPlatform('');
      setFile(null);
      setProjectName('');
      setImporting(false);
      setError(null);
      onClose();
  }

  const platforms = ['Canva', 'Figma', 'Notion', 'GitHub', 'Adobe'];

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
                className="w-full max-w-md p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative"
            >
                <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-4 text-white">Import Project</h2>
                
                <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0, x: 50 },
                      animate: { opacity: 1, x: 0 },
                      exit: { opacity: 0, x: -50 },
                      transition: { duration: 0.2 },
                    }}
                >
                    {step === 1 && (
                      <div>
                        <p className="mb-4 text-gray-400">Select the platform to import from:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {platforms.map(p => (
                            <button
                              key={p}
                              onClick={() => { setPlatform(p.toLowerCase()); setStep(2); }}
                              className="p-4 border-2 border-white/20 bg-white/5 rounded-lg text-white font-semibold hover:border-primary-start hover:bg-primary-start/10 transition-colors"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {step === 2 && (
                      <div className="space-y-4">
                        <p className="text-gray-400">Upload your <span className="font-semibold text-white capitalize">{platform}</span> export:</p>
                        <input
                          type="text"
                          placeholder="New Project Name"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="w-full p-2 border border-white/20 bg-white/5 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-primary-start"
                        />
                         <input
                          type="file"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-start file:text-white hover:file:bg-primary-start/80"
                        />
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <div className="flex gap-2 pt-2">
                           <button onClick={() => setStep(1)} className="px-4 py-2 border border-white/20 bg-white/5 text-white rounded-lg w-full">Back</button>
                          <button
                            onClick={handleImport}
                            disabled={!file || !projectName || importing}
                            className="px-4 py-2 bg-primary-start text-white rounded-lg disabled:opacity-50 w-full"
                          >
                            {importing ? 'Importing...' : 'Import'}
                          </button>
                        </div>
                      </div>
                    )}
                </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
