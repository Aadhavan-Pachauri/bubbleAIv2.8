import React, { useState } from 'react';
import Split from 'react-split-grid';
import { IdeWorkspace, IdeWorkspaceProps } from '../shared/IdeWorkspace';
import { ChatView } from '../../chat/ChatView';
import { CodeBracketIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { useWindowSize } from '../../../hooks/useWindowSize';

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            isActive
                ? 'text-white border-primary-start'
                : 'text-gray-400 border-transparent hover:text-white'
        }`}
    >
        {children}
    </button>
);

export const RobloxWorkspace: React.FC<IdeWorkspaceProps> = (props) => {
    const { width } = useWindowSize();
    const isMobile = width ? width < 1024 : false; // lg breakpoint
    const [mobileTab, setMobileTab] = useState<'chat' | 'code'>('chat');

    if (isMobile) {
        return (
            <div className="h-full w-full bg-bg-primary flex flex-col">
                <div className="flex-shrink-0 flex items-center border-b border-border-color bg-bg-secondary">
                    <TabButton isActive={mobileTab === 'chat'} onClick={() => setMobileTab('chat')}>
                        <ChatBubbleLeftEllipsisIcon className="w-5 h-5" /> Chat
                    </TabButton>
                    <TabButton isActive={mobileTab === 'code'} onClick={() => setMobileTab('code')}>
                        <CodeBracketIcon className="w-5 h-5" /> Code
                    </TabButton>
                </div>
                <div className="flex-1 overflow-hidden">
                    {mobileTab === 'chat' && <ChatView {...props} />}
                    {mobileTab === 'code' && <IdeWorkspace {...props} />}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-transparent text-white">
            <Split
                gridTemplateColumns="minmax(350px, 1fr) 8px 2fr"
                minSize={300}
                cursor="col-resize"
            >
                {/* FIX: The 'render' prop is not valid for 'react-split-grid'. The render function should be passed as a child. */}
                {(split: any) => (
                    <div className="grid h-full w-full bg-bg-primary" {...split.getGridProps()}>
                        <div className="h-full bg-bg-secondary overflow-hidden">
                            <ChatView {...props} />
                        </div>
                        <div className="h-full bg-bg-tertiary cursor-col-resize" {...split.getGutterProps('column', 1)} />
                        <div className="h-full overflow-hidden">
                            <IdeWorkspace {...props} />
                        </div>
                    </div>
                )}
            </Split>
        </div>
    );
};