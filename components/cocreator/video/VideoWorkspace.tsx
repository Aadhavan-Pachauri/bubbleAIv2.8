import React from 'react';
import { IdeWorkspaceProps } from '../shared/IdeWorkspace';
import { FilmIcon } from '@heroicons/react/24/outline';
import Split from 'react-split-grid';
import { ChatView } from '../../chat/ChatView';
import { useWindowSize } from '../../../hooks/useWindowSize';

const VideoPlaceholder: React.FC = () => (
    <div className="h-full flex flex-col bg-bg-primary p-4 text-gray-500">
        <div className="flex-1 bg-black rounded-lg mb-2 flex items-center justify-center border border-border-color">
            <FilmIcon className="w-16 h-16 text-gray-600" />
        </div>
        <div className="h-32 bg-bg-secondary rounded-lg p-2 border border-border-color flex flex-col">
             <div className="text-xs text-gray-400 p-1">Timeline</div>
            <div className="h-full w-full border-2 border-dashed border-gray-600 rounded-md flex items-center justify-center">
                <p>Video editing workspace coming soon</p>
            </div>
        </div>
    </div>
);

export const VideoWorkspace: React.FC<IdeWorkspaceProps> = (props) => {
    const { width } = useWindowSize();
    const isMobile = width ? width < 1024 : false;

    if (isMobile) {
        return <ChatView {...props} />;
    }

     return (
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
                           <VideoPlaceholder />
                        </div>
                    </div>
                )}
            </Split>
        </div>
    );
};