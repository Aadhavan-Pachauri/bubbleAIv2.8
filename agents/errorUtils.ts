export const getUserFriendlyError = (error: Error | any): string => {
  if (!(error instanceof Error)) {
    // Try to stringify if it's an object, otherwise just return a generic message
    if (typeof error === 'object' && error !== null && error.message) {
        return `Something went wrong: ${error.message}`;
    }
    return "An unexpected error occurred. Please try again.";
  }

  const msg = error.message.toLowerCase();
  
  if (msg.includes('schema') || msg.includes('cache')) {
    return "There was a quick hiccup with the database. A page refresh usually fixes this. Please refresh and try again.";
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('rpc failed')) {
    return "It seems there's a connection issue. Please check your internet and disable any ad-blockers, then try again.";
  }
  if (msg.includes('api key') || msg.includes('unauthorized')) {
    return "There seems to be an issue with your API key. Please check it in your settings.";
  }
  if (msg.includes('rate limit') || msg.includes('quota')) {
    return "Looks like we're making too many requests. Please wait a moment and try again.";
  }
  return `Something went wrong. Here are the details: ${error.message}`;
};
