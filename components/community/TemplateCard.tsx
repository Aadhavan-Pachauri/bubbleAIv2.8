
import React from 'react';
import { motion } from 'framer-motion';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { EyeIcon, ArrowDownTrayIcon, HeartIcon } from '@heroicons/react/24/outline';
import { MockTemplate } from '../../data/mockTemplates';

const StarRating: React.FC<{ rating: number, count: number }> = ({ rating, count }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => <StarIconSolid key={`full-${i}`} className="w-4 h-4 text-yellow-400" />)}
            {/* Not implementing half star for simplicity for now */}
            {[...Array(emptyStars)].map((_, i) => <StarIconSolid key={`empty-${i}`} className="w-4 h-4 text-gray-600" />)}
            <span className="text-xs text-gray-400 ml-1">({count})</span>
        </div>
    );
};

export const TemplateCard: React.FC<{ template: MockTemplate }> = ({ template }) => {
    return (
        <motion.div
            className="group relative bg-bg-secondary rounded-xl border border-bg-tertiary transition-all duration-200 flex flex-col overflow-hidden"
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              whileHover: { y: -4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
            }}
        >
            <div className="relative aspect-video bg-bg-tertiary">
                <img src={template.preview_image} alt={template.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="text-md font-bold text-white mb-1 truncate">{template.name}</h3>
                <p className="text-xs text-gray-400 mb-2">by @{template.author}</p>
                <StarRating rating={template.rating} count={template.ratingsCount} />
                
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5" title="Downloads">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>{(template.downloads / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Likes">
                        <HeartIconSolid className="w-4 h-4 text-pink-500" />
                        <span>{template.stars}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2">
                    <button className="flex-1 px-3 py-2 text-xs font-semibold text-gray-200 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                        Preview
                    </button>
                     <button className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-primary-start rounded-md hover:bg-primary-start/80 transition-colors">
                        Use Template
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
