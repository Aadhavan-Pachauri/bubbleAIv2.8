import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { MermaidModal } from '../modals/MermaidModal';

export const MermaidDiagram: React.FC<{ graphDefinition: string }> = ({ graphDefinition }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState('');
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();
    const { profile } = useAuth();
    const theme = profile?.ui_theme || 'dark';

    useEffect(() => {
        const renderMermaid = async () => {
            const trimmedGraphDef = graphDefinition ? graphDefinition.trim() : '';
            
            if (trimmedGraphDef && (window as any).mermaid) {
                const { mermaidAPI } = (window as any).mermaid;
                try {
                    // A unique ID is crucial for re-rendering with new themes
                    const uniqueId = `mermaid-graph-${Date.now()}-${Math.random()}`;
                    await mermaidAPI.parse(trimmedGraphDef);
                    setError('');

                    const { svg } = await mermaidAPI.render(uniqueId, trimmedGraphDef);
                    setSvgContent(svg);
                } catch (e) {
                    const errorMessage = "Could not render the visual plan. The diagram syntax returned by the AI appears to be invalid.";
                    console.error("Mermaid rendering error:", e);
                    setError(errorMessage);
                    setSvgContent('');
                    addToast(errorMessage, 'error');
                }
            } else {
                setSvgContent('');
            }
        };
        renderMermaid();
    }, [graphDefinition, addToast, theme]);

    if (error) {
        return (
            <div className="p-4 bg-error/10 text-error/80 text-sm rounded-lg flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Visual Plan Error</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!svgContent) {
        return <div className="p-4 text-center text-gray-500">Generating blueprint...</div>;
    }

    return (
        <>
            <div className="relative group">
                <div ref={mermaidRef} dangerouslySetInnerHTML={{ __html: svgContent }} className="flex justify-center p-2" />
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                    aria-label="Enlarge diagram"
                >
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-primary rounded-full text-white text-sm shadow-lg">
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                        <span>View Larger</span>
                    </div>
                </button>
            </div>
            <AnimatePresence>
                {isModalOpen && <MermaidModal svgContent={svgContent} onClose={() => setIsModalOpen(false)} />}
            </AnimatePresence>
        </>
    );
};
