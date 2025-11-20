
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, PlusIcon, MinusIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

export const MermaidModal: React.FC<{ svgContent: string; onClose: () => void }> = ({ svgContent, onClose }) => {
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const diagramRef = useRef<HTMLDivElement>(null);
    const panState = useRef({ isPanning: false, startX: 0, startY: 0 });
    const pinchState = useRef({ isPinching: false, initialDist: 0, initialScale: 1 });

    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!diagramRef.current) return;
    
        const rect = diagramRef.current.getBoundingClientRect();
        const zoomIntensity = 0.1;
        const newScale = clamp(transform.scale - e.deltaY * zoomIntensity * 0.1, 0.2, 8);
    
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
        if (diagramRef.current) diagramRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!panState.current.isPanning) return;
        const newX = e.clientX - panState.current.startX;
        const newY = e.clientY - panState.current.startY;
        setTransform({ ...transform, x: newX, y: newY });
    };

    const handleMouseUp = () => {
        panState.current.isPanning = false;
        if (diagramRef.current) diagramRef.current.style.cursor = 'grab';
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            panState.current = {
                isPanning: true,
                startX: touch.clientX - transform.x,
                startY: touch.clientY - transform.y,
            };
        } else if (e.touches.length === 2) {
             panState.current.isPanning = false;
             const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
             pinchState.current = { isPinching: true, initialDist: dist, initialScale: transform.scale };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1 && panState.current.isPanning) {
            const touch = e.touches[0];
            const newX = touch.clientX - panState.current.startX;
            const newY = touch.clientY - panState.current.startY;
            setTransform({ ...transform, x: newX, y: newY });
        } else if (e.touches.length === 2 && pinchState.current.isPinching && diagramRef.current) {
            const rect = diagramRef.current.getBoundingClientRect();
            const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            const scaleFactor = newDist / pinchState.current.initialDist;
            const newScale = clamp(pinchState.current.initialScale * scaleFactor, 0.2, 8);
            
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

            const newX = midX - (midX - transform.x) * (newScale / transform.scale);
            const newY = midY - (midY - transform.y) * (newScale / transform.scale);
            
            setTransform({ scale: newScale, x: newX, y: newY });
        }
    };

    const handleTouchEnd = () => {
        panState.current.isPanning = false;
        pinchState.current.isPinching = false;
    };
    
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault();
         if (!diagramRef.current) return;
        const rect = diagramRef.current.getBoundingClientRect();
        const newScale = clamp(transform.scale * 1.8, 0.2, 8);
    
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
    
        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
    
        setTransform({ scale: newScale, x: newX, y: newY });
    };

    const zoom = (direction: number) => {
        if (!diagramRef.current) return;
        const rect = diagramRef.current.getBoundingClientRect();
        const zoomIntensity = 0.5;
        const newScale = clamp(transform.scale + direction * zoomIntensity, 0.2, 8);
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
            onMouseLeave={handleMouseUp} // Stop panning if mouse leaves window
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 bg-bg-secondary rounded-full hover:text-white transition-colors z-20">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                
                {/* Diagram Container */}
                <div
                    ref={diagramRef}
                    className="w-full h-full flex items-center justify-center"
                    style={{ cursor: 'grab' }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onDoubleClick={handleDoubleClick}
                >
                    <div
                        className="transition-transform duration-[50ms] ease-linear"
                        style={{
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        }}
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-bg-secondary rounded-full shadow-lg z-20">
                     <button onClick={() => zoom(-1)} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <MinusIcon className="w-6 h-6" />
                    </button>
                    <button onClick={resetTransform} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Reset View">
                        <ArrowsPointingInIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => zoom(1)} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
