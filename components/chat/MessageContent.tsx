import React from 'react';
import { CodeBlock } from '../ui/CodeBlock';

// New component to handle markdown (bold/italic) and search highlighting
const TextRenderer: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    // Regex to split the string by markdown formatting.
    // It captures the formatted parts, so they appear in the resulting array.
    const regex = /(\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|\*[\s\S]+?\*|___[\s\S]+?___|__[\s\S]+?__|_[\s\S]+?_)/g;
    const parts = text.split(regex);
    
    const applyHighlight = (str: string): React.ReactNode[] => {
        if (!highlight.trim()) {
            return [str];
        }
        const highlightRegex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const highlightedParts = str.split(highlightRegex);

        return highlightedParts.map((p, i) => 
            highlightRegex.test(p) ? (
                <mark key={i} className="bg-yellow-400 text-black rounded px-0.5 py-0">
                    {p}
                </mark>
            ) : p
        );
    };
    
    return (
        <>
            {parts.map((part, index) => {
                if (!part) return null;

                if (part.startsWith('***') && part.endsWith('***')) {
                    return <strong key={index}><em>{applyHighlight(part.slice(3, -3))}</em></strong>;
                }
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{applyHighlight(part.slice(2, -2))}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={index}>{applyHighlight(part.slice(1, -1))}</em>;
                }
                // Underscore versions
                if (part.startsWith('___') && part.endsWith('___')) {
                    return <strong key={index}><em>{applyHighlight(part.slice(3, -3))}</em></strong>;
                }
                if (part.startsWith('__') && part.endsWith('__')) {
                    return <strong key={index}>{applyHighlight(part.slice(2, -2))}</strong>;
                }
                if (part.startsWith('_') && part.endsWith('_')) {
                    return <em key={index}>{applyHighlight(part.slice(1, -1))}</em>;
                }
                
                // It's a plain text part
                return applyHighlight(part);
            })}
        </>
    );
};

interface MessageContentProps {
  content: string;
  searchQuery: string;
  sender: 'user' | 'ai';
  isTyping?: boolean;
}

const codeBlockRegex = /```(\w+)?(?::(\S+))?\s*([\s\S]*?)```/g;
// This regex captures the entire code block including the fences, which is crucial for the split method to work correctly.
const splitRegex = /(```(?:\w+)?(?::\S+)?\s*[\s\S]*?```)/g;

export const MessageContent: React.FC<MessageContentProps> = ({ content, searchQuery, sender, isTyping = false }) => {
  if (!content && !isTyping) return null;

  // The content is now streamed directly from the parent, no effect needed.
  const parts = content.split(splitRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        // Use matchAll to get an iterator and convert to an array to check for a match.
        const match = [...part.matchAll(codeBlockRegex)][0];
        
        if (match) {
          // This part is a code block
          const language = match[1] || 'plaintext';
          const filename = match[2] || null;
          const code = match[3].trim();
          
          return (
            <div key={index} className="not-prose">
                <CodeBlock code={code} language={language} filename={filename} />
            </div>
          );
        } else {
          // This part is plain text, render it with formatting
          return (
            <p key={index} className="whitespace-pre-wrap">
              <TextRenderer text={part} highlight={searchQuery} />
            </p>
          );
        }
      })}
      {isTyping && sender === 'ai' && (
        <span className="inline-block w-0.5 h-5 align-bottom bg-text-primary animate-blink" />
      )}
    </>
  );
};