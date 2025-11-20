import React, { useMemo } from 'react';
import { Project } from '../../types';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface WebAppPreviewProps {
  project: Project;
}

export const WebAppPreview: React.FC<WebAppPreviewProps> = ({ project }) => {
  const selfContainedHtml = useMemo(() => {
    if (!project.files) {
      return null;
    }

    const htmlFilePath =
      Object.keys(project.files).find(p => p.toLowerCase() === 'index.html') ||
      Object.keys(project.files).find(p => p.toLowerCase().endsWith('.html'));

    if (!htmlFilePath) {
      return null;
    }

    let htmlContent = project.files[htmlFilePath].content;

    // Regex to find <link ... href="path/to/style.css" ...>
    // It avoids matching external URLs (http://, https://, //)
    const cssLinkRegex = /<link\s+[^>]*?href=["'](?!https?:\/\/|\/\/)([^"']+\.css)["'][^>]*?>/gi;
    htmlContent = htmlContent.replace(cssLinkRegex, (match, href) => {
      // The path might be relative, so we need to resolve it.
      // For now, assuming paths are from the root. A more complex resolver
      // might be needed for paths like ../styles/main.css
      const cssContent = project.files?.[href]?.content;
      return cssContent
        ? `<style>\n${cssContent}\n</style>`
        : `<!-- CSS file not found: ${href} -->`;
    });

    // Regex to find <script ... src="path/to/script.js" ...></script>
    // It also avoids matching external URLs.
    const jsScriptRegex = /<script\s+[^>]*?src=["'](?!https?:\/\/|\/\/)([^"']+\.js)["'][^>]*?>\s*<\/script>/gi;
    htmlContent = htmlContent.replace(jsScriptRegex, (match, src) => {
      const jsContent = project.files?.[src]?.content;
      return jsContent
        ? `<script>\n${jsContent}\n</script>`
        : `<!-- JS file not found: ${src} -->`;
    });

    return htmlContent;
  }, [project.files]);

  return (
    <div className="w-full h-full bg-white overflow-hidden">
      {selfContainedHtml ? (
        <iframe
          srcDoc={selfContainedHtml}
          title="Web App Preview"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div className="p-4 h-full flex flex-col items-center justify-center bg-gray-100 text-center">
          <ComputerDesktopIcon className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="font-semibold text-gray-600">Live Preview</h3>
          <p className="text-gray-500 text-sm max-w-xs">
            The live preview for your web app will appear here as the AI generates an HTML file.
          </p>
        </div>
      )}
    </div>
  );
};
