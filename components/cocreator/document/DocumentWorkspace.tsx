
import React, { useState, useEffect, useMemo } from 'react';
import Split from 'react-split-grid';
import { IdeWorkspaceProps } from '../shared/IdeWorkspace';
import { ChatView } from '../../chat/ChatView';
import { useWindowSize } from '../../../hooks/useWindowSize';

const DocumentEditor: React.FC<{
    project: IdeWorkspaceProps['project'];
    onActiveProjectUpdate: IdeWorkspaceProps['onActiveProjectUpdate'];
}> = ({ project, onActiveProjectUpdate }) => {
    
    const [content, setContent] = useState('');

    const documentFile = useMemo(() => {
        if (!project.files) return null;
        const filePaths = Object.keys(project.files);
        // Prioritize .md, then .txt, then the first file found
        return filePaths.find(p => p.endsWith('.md')) || filePaths.find(p => p.endsWith('.txt')) || filePaths[0] || 'document.md';
    }, [project.files]);

    useEffect(() => {
        const fileContent = documentFile ? project.files?.[documentFile]?.content || '' : 'Start writing your document... The AI will create a file for you.';
        setContent(fileContent);
    }, [documentFile, project.files]);

    useEffect(() => {
        // Debounced auto-save
        const handler = setTimeout(() => {
            if (documentFile && onActiveProjectUpdate && content !== project.files?.[documentFile]?.content) {
                 const updatedFiles = {
                    ...(project.files || {}),
                    [documentFile]: { content: content }
                };
                onActiveProjectUpdate({ files: updatedFiles });
            }
        }, 1500); // Auto-save after 1.5s of inactivity

        return () => {
            clearTimeout(handler);
        };
    }, [content, documentFile, project.files, onActiveProjectUpdate]);


    return (
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-8 lg:p-12 bg-bg-primary text-gray-300 resize-none focus:outline-none leading-relaxed prose prose-invert"
            placeholder="Start writing your document..."
        />
    );
};


export const DocumentWorkspace: React.FC<IdeWorkspaceProps> = (props) => {
    const { width } = useWindowSize();
    const isMobile = width ? width < 1024 : false;

    // On mobile, just show chat for simplicity
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
                           <DocumentEditor project={props.project} onActiveProjectUpdate={props.onActiveProjectUpdate} />
                        </div>
                    </div>
                )}
            </Split>
        </div>
    );
};
