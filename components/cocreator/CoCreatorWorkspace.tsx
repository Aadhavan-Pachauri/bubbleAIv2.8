import React from 'react';
import { Project } from '../../types';
import { IdeWorkspaceProps } from './shared/IdeWorkspace';
import { RobloxWorkspace } from './roblox/RobloxWorkspace';
import { WebAppWorkspace } from './webapp/WebAppWorkspace';
import { StoryWorkspace } from './story/StoryWorkspace';
import { VideoWorkspace } from './video/VideoWorkspace';
import { DesignWorkspace } from './design/DesignWorkspace';
import { PresentationWorkspace } from './presentation/PresentationWorkspace';
import { DocumentWorkspace } from './document/DocumentWorkspace';

interface CoCreatorWorkspaceProps extends IdeWorkspaceProps {
    project: Project;
}

export const CoCreatorWorkspace: React.FC<CoCreatorWorkspaceProps> = (props) => {
    const { project } = props;

    switch (project.project_type) {
        case 'roblox_game':
            return <RobloxWorkspace {...props} />;
        case 'website':
            return <WebAppWorkspace {...props} />;
        case 'story':
            return <StoryWorkspace {...props} />;
        case 'video':
            return <VideoWorkspace {...props} />;
        case 'design':
            return <DesignWorkspace {...props} />;
        case 'presentation':
            return <PresentationWorkspace {...props} />;
        case 'document':
            return <DocumentWorkspace {...props} />;
        default:
            // Fallback for conversation or unknown types
            return (
                 <div className="flex items-center justify-center h-full text-center p-8 text-gray-500 bg-bg-primary">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-300">Unsupported Project Type</h2>
                        <p>This project type ('{project.project_type}') does not have a dedicated workspace.</p>
                    </div>
                </div>
            );
    }
};
