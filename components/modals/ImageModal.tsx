
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, PlusIcon, MinusIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

// New Image Modal Component for viewing generated images
export const ImageModal: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const panState = useRef({ isPanning: false, startX: 0, startY: 0 });

    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;
    
        const rect = containerRef.current.getBoundingClientRect();
        const zoomIntensity = 0.1;
        const newScale = clamp(transform.scale - e.deltaY * zoomIntensity * 0.1, 0.2, 5);
    
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
    
        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
    
        setTransform({ scale: newScale, x: newX, y: newY });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        panState.current = {
            isPanning: true,
            startX: e.clientX - transform.x,
            startY: e.clientY - transform.y,
        };
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!panState.current.isPanning) return;
        const newX = e.clientX - panState.current.startX;
        const newY = e.clientY - panState.current.startY;
        setTransform({ ...transform, x: newX, y: newY });
    };

    const handleMouseUp = () => {
        panState.current.isPanning = false;
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
    };

    const zoom = (direction: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const zoomIntensity = 0.4;
        const newScale = clamp(transform.scale + direction * zoomIntensity, 0.2, 5);
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const newX = centerX - (centerX - transform.x) * (newScale / transform.scale);
        const newY = centerY - (centerY - transform.y) * (newScale / transform.scale);
        setTransform({ scale: newScale, x: newX, y: newY });
    };
    
    const resetTransform = () => setTransform({ scale: 1, x: 0, y: 0 });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <motion.div
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  initial: { scale: 0.9, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  exit: { scale: 0.9, opacity: 0 },
                  transition: { type: 'spring', stiffness: 260, damping: 20 },
                }}
                className="relative w-full h-full bg-transparent flex items-center justify-center overflow-hidden"
                onWheel={handleWheel}
            >
                {/* Close Button in corner */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 bg-bg-secondary rounded-full hover:text-white transition-colors z-20">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                
                {/* Image Container */}
                <div
                    ref={containerRef}
                    className="w-full h-full flex items-center justify-center p-8"
                    style={{ cursor: 'grab' }}
                    onMouseDown={handleMouseDown}
                >
                    <img
                        className="max-w-full max-h-full object-contain transition-transform duration-[50ms] ease-linear"
                        src={src}
                        alt="Enlarged generated content"
                        style={{
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        }}
                    />
                </div>

                {/* Control Bubble */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-bg-secondary rounded-full shadow-lg z-20">
                     <button onClick={() => zoom(-1)} title="Zoom Out" className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <MinusIcon className="w-6 h-6" />
                    </button>
                    <button onClick={resetTransform} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Reset View">
                        <ArrowsPointingInIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => zoom(1)} title="Zoom In" className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
