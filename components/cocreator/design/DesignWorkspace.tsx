import React, { useMemo, useState, useRef } from 'react';
import Split from 'react-split-grid';
import { IdeWorkspaceProps } from '../shared/IdeWorkspace';
import { ChatView } from '../../chat/ChatView';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon, MinusIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { useWindowSize } from '../../../hooks/useWindowSize';

// Inlined ImageModal component to avoid creating new files.
const ImageModal: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
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
        panState.current = { isPanning: true, startX: e.clientX - transform.x, startY: e.clientY - transform.y };
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!panState.current.isPanning) return;
        setTransform({ ...transform, x: e.clientX - panState.current.startX, y: e.clientY - panState.current.startY });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <motion.div
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  initial: { scale: 0.9, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  exit: { scale: 0.9, opacity: 0 },
                  transition: { type: 'spring', stiffness: 260, damping: 20 },
                }}
                className="relative w-full h-full bg-transparent flex items-center justify-center overflow-hidden" onWheel={handleWheel}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 bg-bg-secondary rounded-full hover:text-white transition-colors z-20"><XMarkIcon className="w-6 h-6" /></button>
                <div ref={containerRef} className="w-full h-full flex items-center justify-center p-8" style={{ cursor: 'grab' }} onMouseDown={handleMouseDown}>
                    <img className="max-w-full max-h-full object-contain transition-transform duration-[50ms] ease-linear" src={src} alt="Enlarged generated content" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}/>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-bg-secondary rounded-full shadow-lg z-20">
                     <button onClick={() => zoom(-1)} title="Zoom Out" className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"><MinusIcon className="w-6 h-6" /></button>
                    <button onClick={resetTransform} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Reset View"><ArrowsPointingInIcon className="w-6 h-6" /></button>
                    <button onClick={() => zoom(1)} title="Zoom In" className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"><PlusIcon className="w-6 h-6" /></button>
                </div>
            </motion.div>
        </div>
    );
};

export const DesignWorkspace: React.FC<IdeWorkspaceProps> = (props) => {
    const { width } = useWindowSize();
    const isMobile = width ? width < 1024 : false;
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const generatedImages = useMemo(() => {
        return props.messages
            .filter(msg => msg.sender === 'ai' && msg.image_base64)
            .map(msg => msg.image_base64!);
    }, [props.messages]);

    const galleryContent = (
         <div className="h-full overflow-y-auto p-4 md:p-6 bg-bg-primary">
            <h2 className="text-xl font-bold mb-4 text-white">Design Canvas</h2>
            {generatedImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {generatedImages.map((imgSrc, index) => (
                        <motion.div
                            key={index}
                            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                            {...{
                              layoutId: `image-${index}`,
                            }}
                            className="aspect-square bg-bg-secondary rounded-lg overflow-hidden cursor-pointer group" onClick={() => setSelectedImage(imgSrc)}>
                            <img src={`data:image/png;base64,${imgSrc}`} alt={`Generated design ${index + 1}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-center">
                    <p>Images generated by the AI will appear here.</p>
                </div>
            )}
        </div>
    );

    if (isMobile) {
        return <ChatView {...props} />; // Keep it simple on mobile
    }

    return (
        <>
            <div className="h-full w-full bg-transparent text-white">
                <Split gridTemplateColumns="minmax(350px, 1fr) 8px 2fr" minSize={300} cursor="col-resize">
                    {/* FIX: The 'render' prop is not valid for 'react-split-grid'. The render function should be passed as a child. */}
                    {(split: any) => (
                        <div className="grid h-full w-full bg-bg-primary" {...split.getGridProps()}>
                            <div className="h-full bg-bg-secondary overflow-hidden">
                                <ChatView {...props} />
                            </div>
                            <div className="h-full bg-bg-tertiary cursor-col-resize" {...split.getGutterProps('column', 1)} />
                            <div className="h-full overflow-hidden">
                               {galleryContent}
                            </div>
                        </div>
                    )}
                </Split>
            </div>
            <AnimatePresence>
                {selectedImage && <ImageModal src={`data:image/png;base64,${selectedImage}`} onClose={() => setSelectedImage(null)} />}
            </AnimatePresence>
        </>
    );
};