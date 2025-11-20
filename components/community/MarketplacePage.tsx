
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BuildingStorefrontIcon, MagnifyingGlassIcon, CodeBracketSquareIcon, BookOpenIcon, SparklesIcon, StarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { mockTemplates } from '../../data/mockTemplates';
import { TemplateCard } from './TemplateCard';

type MainTab = 'templates' | 'blueprints' | 'snippets';
type FilterTab = 'trending' | 'top_rated' | 'new';

const PlaceholderContent: React.FC<{ title: string, icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex flex-col items-center justify-center text-center p-16 text-gray-500">
        <div className="mb-4">{icon}</div>
        <h2 className="text-xl font-semibold text-gray-300">The {title} marketplace is coming soon!</h2>
        <p>A dedicated space for sharing and discovering {title.toLowerCase()}.</p>
    </div>
);

export const MarketplacePage: React.FC = () => {
    const [mainTab, setMainTab] = useState<MainTab>('templates');
    const [filterTab, setFilterTab] = useState<FilterTab>('trending');

    const renderContent = () => {
        switch (mainTab) {
            case 'templates':
                return (
                    <motion.div 
                        key="templates"
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          initial: { opacity: 0, y: 10 },
                          animate: { opacity: 1, y: 0 },
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {mockTemplates.map(template => (
                            <TemplateCard key={template.id} template={template} />
                        ))}
                    </motion.div>
                );
            case 'blueprints':
                return <PlaceholderContent title="Blueprints" icon={<BookOpenIcon className="w-16 h-16 text-primary-start/50"/>} />;
            case 'snippets':
                return <PlaceholderContent title="Code Snippets" icon={<CodeBracketSquareIcon className="w-16 h-16 text-primary-start/50"/>} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white">Community Marketplace</h1>
                <p className="text-gray-400 mt-1">Discover templates, blueprints, and snippets from the community.</p>
            </header>
            
            <div className="sticky top-0 bg-bg-primary/80 backdrop-blur-sm z-10 py-4 mb-6">
                {/* Main Tabs */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 p-1 bg-black/20 rounded-lg">
                        <button onClick={() => setMainTab('templates')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${mainTab === 'templates' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                            <BuildingStorefrontIcon className="w-5 h-5" /> Templates
                        </button>
                        <button onClick={() => setMainTab('blueprints')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${mainTab === 'blueprints' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                            <BookOpenIcon className="w-5 h-5" /> Blueprints
                        </button>
                        <button onClick={() => setMainTab('snippets')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${mainTab === 'snippets' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                            <CodeBracketSquareIcon className="w-5 h-5" /> Snippets
                        </button>
                    </div>
                     <div className="relative w-72">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            className="bg-bg-secondary/50 border border-bg-tertiary rounded-lg pl-10 pr-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-start"
                        />
                    </div>
                </div>

                {/* Filters (only for templates tab) */}
                {mainTab === 'templates' && (
                    <div className="mt-4 flex items-center gap-4 border-b border-border-color">
                        <button onClick={() => setFilterTab('trending')} className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors border-b-2 ${filterTab === 'trending' ? 'text-primary-start border-primary-start' : 'text-gray-400 border-transparent hover:text-white'}`}>
                            <SparklesIcon className="w-5 h-5"/> Trending
                        </button>
                        <button onClick={() => setFilterTab('top_rated')} className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors border-b-2 ${filterTab === 'top_rated' ? 'text-primary-start border-primary-start' : 'text-gray-400 border-transparent hover:text-white'}`}>
                           <StarIcon className="w-5 h-5"/> Top Rated
                        </button>
                        <button onClick={() => setFilterTab('new')} className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors border-b-2 ${filterTab === 'new' ? 'text-primary-start border-primary-start' : 'text-gray-400 border-transparent hover:text-white'}`}>
                            <ClockIcon className="w-5 h-5"/> New
                        </button>
                    </div>
                )}
            </div>
            
            {renderContent()}
        </div>
    );
};
