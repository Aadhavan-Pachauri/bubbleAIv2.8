import React from 'react';

interface BottomPanelProps {
    children: React.ReactNode;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-full bg-bg-primary">
            {/* The chat view is now the only content, no tabs needed */}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
