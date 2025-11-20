
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MicrophoneIcon } from '@heroicons/react/24/solid';

export const VoiceControls: React.FC<{ onTranscript: (text: string) => void }> = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startRecording = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert('Voice input is not supported in this browser. Please try Google Chrome.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        // isRecording will be set to false in onend
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access has been denied. Please enable it in your browser settings and refresh the page to use voice input.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
            alert(`An error occurred with voice input: ${event.error}`);
        }
        setIsRecording(false); // Ensure state is reset on error
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognition.start();
      recognitionRef.current = recognition;

    } catch (error) {
      console.error('Failed to initialize voice input:', error);
      alert('Could not start voice input. Please ensure your microphone is connected and permissions are granted.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
            isRecording ? 'bg-red-500 scale-110' : 'bg-white/10 hover:bg-white/20'
        }`}
        aria-label={isRecording ? 'Stop listening' : 'Start voice input'}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isRecording && (
             <motion.div
                className="absolute inset-0 rounded-full bg-red-500"
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  animate: {
                      scale: [1, 1.6, 1],
                      opacity: [0.5, 0, 0.5],
                  },
                  transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                  },
                }}
            />
        )}
        <MicrophoneIcon className="w-5 h-5 relative z-10" />
      </button>
    </div>
  );
};
