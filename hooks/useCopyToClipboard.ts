import { useState, useCallback } from 'react';

export const useCopyToClipboard = (textToCopy: string) => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(() => {
    if (isCopied) return;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000); // Reset after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        // You might want to show an error toast here
      });
  }, [textToCopy, isCopied]);

  return { isCopied, copy };
};
