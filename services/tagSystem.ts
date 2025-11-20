interface MCPServerConfig {
  name: string;
  package: string;
  tags: string[];
  description: string;
}

export const MCP_SERVER_REGISTRY: MCPServerConfig[] = [
  // Network & Search
  { name: 'brave-search', package: '@modelcontextprotocol/server-brave-search', tags: ['network', 'search', 'web', 'research'], description: 'Web search with Brave' },
  { name: 'perplexity', package: '@modelcontextprotocol/server-perplexity', tags: ['network', 'search', 'web', 'research', 'ai', 'advanced'], description: 'AI-powered search' },
  { name: 'jina-reader', package: '@modelcontextprotocol/server-jina-reader', tags: ['network', 'web', 'scrape'], description: 'Scrape web content' },
  
  // File System
  { name: 'filesystem', package: '@modelcontextprotocol/server-filesystem', tags: ['filesystem', 'files', 'local'], description: 'Local file operations' },
  { name: 'google-drive', package: '@modelcontextprotocol/server-google-drive', tags: ['filesystem', 'files', 'cloud', 'storage'], description: 'Google Drive integration' },
  
  // Development & Code
  { name: 'github', package: '@modelcontextprotocol/server-github', tags: ['development', 'git', 'code', 'version-control'], description: 'GitHub repository management' },
  { name: 'vscode', package: '@modelcontextprotocol/server-vscode', tags: ['development', 'editor', 'code'], description: 'VS Code integration' },
  
  // Databases
  { name: 'supabase', package: '@modelcontextprotocol/server-supabase', tags: ['database', 'storage', 'backend', 'auth', 'sql'], description: 'Supabase database' },
  { name: 'postgres', package: '@modelcontextprotocol/server-postgres', tags: ['database', 'sql', 'backend'], description: 'PostgreSQL database' },
  
  // Security
  { name: 'auth0', package: '@modelcontextprotocol/server-auth0', tags: ['security', 'auth', 'authentication'], description: 'Auth0 authentication' },
  
  // AI & ML
  { name: 'huggingface', package: '@modelcontextprotocol/server-huggingface', tags: ['ai', 'ml', 'models', 'inference'], description: 'HuggingFace AI models' },
  
  // ... (Imagine all 60+ servers are registered here)
];

export class TagSystem {
  // Get servers by tags
  getServersByTags(tags: string[]): MCPServerConfig[] {
    const uniqueServers = new Map<string, MCPServerConfig>();
    MCP_SERVER_REGISTRY.forEach(server => {
      if (tags.some(tag => server.tags.includes(tag))) {
        uniqueServers.set(server.name, server);
      }
    });
    return Array.from(uniqueServers.values());
  }

  // Detect tags from user prompt
  detectTags(prompt: string): string[] {
    const tagKeywords: Record<string, string[]> = {
      'network': ['search', 'web', 'internet', 'online', 'browse', 'scrape', 'lookup'],
      'filesystem': ['file', 'folder', 'save', 'load', 'read', 'write', 'directory'],
      'database': ['database', 'data', 'store', 'query', 'sql', 'supabase'],
      'code': ['code', 'program', 'script', 'function', 'class', 'develop'],
      'git': ['github', 'commit', 'push', 'pull', 'repository', 'repo', 'version'],
      'security': ['login', 'auth', 'password', 'secure', 'encrypt', 'user'],
      'ai': ['ai', 'model', 'generate', 'predict', 'machine learning', 'image'],
      'cloud': ['cloud', 'upload', 'download', 'drive', 'storage', 'gdrive']
    };

    const detected = new Set<string>();
    const lower = prompt.toLowerCase();

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(kw => lower.includes(kw))) {
        detected.add(tag);
      }
    }

    const detectedArray = Array.from(detected);
    return detectedArray.length > 0 ? detectedArray : ['general']; // Fallback tag
  }

  // Get recommended servers for prompt
  getRecommendedServers(prompt: string): MCPServerConfig[] {
    const tags = this.detectTags(prompt);
    return this.getServersByTags(tags);
  }
}

export const tagSystem = new TagSystem();