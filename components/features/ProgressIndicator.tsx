
import React from 'react';
import { motion } from 'framer-motion';

// Shows real-time progress for long operations
export const ProgressIndicator: React.FC<{
  tasks: string[];
  currentTask: number;
}> = ({ tasks, currentTask }) => {
  return (
    <motion.div 
        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
        {...{
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 20 },
        }}
        className="fixed bottom-4 right-4 bg-bg-secondary/80 backdrop-blur-lg border border-white/10 shadow-2xl rounded-xl p-4 max-w-sm w-full z-[101]"
    >
      <h3 className="font-semibold mb-3 text-white">Working on it... 🔥</h3>
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                {index < currentTask ? (
                    <motion.div
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          initial: {scale:0},
                          animate: {scale:1},
                        }}
                        className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </motion.div>
                ) : index === currentTask ? (
                    <div className="w-4 h-4 rounded-full bg-primary-start animate-pulse"></div>
                ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-500"></div>
                )}
            </div>
            <span className={index === currentTask ? 'font-medium text-white' : 'text-gray-400'}>
              {task}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};