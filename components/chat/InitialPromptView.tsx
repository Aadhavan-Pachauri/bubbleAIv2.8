
import React from 'react';
import { motion } from 'framer-motion';

interface InitialPromptViewProps {
  onSendMessage: (text: string) => void;
}

const promptStarters = [
  "How do I make a part that gives players points?",
  "Create a plan for a simple sword fighting game",
  "What's the best way to handle player data?",
  "Write a script for a day/night cycle",
];

export const InitialPromptView: React.FC<InitialPromptViewProps> = ({ onSendMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-white overflow-y-auto">
      <motion.div
        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
        {...{
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5 },
        }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Co-Creator Mode
          </h1>
          <p className="text-lg text-gray-400 mt-4">This chat is empty. Start with a prompt below, or type your own.</p>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-center mb-6">Prompt Starters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promptStarters.map((prompt, index) => (
                    <motion.button
                        key={index}
                        onClick={() => onSendMessage(prompt)}
                        className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg text-left hover:bg-bg-tertiary transition-colors"
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          whileHover: { scale: 1.03 },
                          whileTap: { scale: 0.98 },
                        }}
                    >
                        <p className="text-gray-300">{prompt}</p>
                    </motion.button>
                ))}
            </div>
        </div>
      </motion.div>
    </div>
  );
};
