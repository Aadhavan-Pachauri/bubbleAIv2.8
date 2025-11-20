interface APIConfig {
  name: string;
  url: string;
  key?: string;
  freeLimit: { amount: number; period: 'per-minute' | 'hourly' | 'daily' | 'monthly' | 'unlimited' };
  currentUsage: number;
  lastReset: Date;
}

export class FreeAPIManager {
  private apis: Record<string, APIConfig[]> = {
    // Web Search APIs
    search: [
      {
        name: 'Brave Search',
        url: 'https://api.search.brave.com/res/v1/web/search',
        key: process.env.BRAVE_API_KEY,
        freeLimit: { amount: 2000, period: 'monthly' },
        currentUsage: 0,
        lastReset: new Date()
      },
      {
        name: 'DuckDuckGo (Mock)',
        url: 'https://api.duckduckgo.com',
        freeLimit: { amount: Infinity, period: 'unlimited' },
        currentUsage: 0,
        lastReset: new Date()
      }
    ],

    // Web Scraping APIs
    scraping: [
      {
        name: 'Jina Reader',
        url: 'https://r.jina.ai/',
        freeLimit: { amount: 20, period: 'daily' },
        currentUsage: 0,
        lastReset: new Date()
      },
      {
        name: 'ScraperAPI (Mock)',
        url: 'https://api.scraperapi.com',
        key: process.env.SCRAPER_API_KEY,
        freeLimit: { amount: 1000, period: 'monthly' },
        currentUsage: 0,
        lastReset: new Date()
      }
    ],

    // AI Model APIs
    ai: [
      {
        name: 'Gemini Flash',
        url: 'https://generativelanguage.googleapis.com/v1/models',
        key: process.env.GEMINI_API_KEY,
        freeLimit: { amount: 60, period: 'per-minute' },
        currentUsage: 0,
        lastReset: new Date()
      },
      {
        name: 'HuggingFace (Mock)',
        url: 'https://api-inference.huggingface.co',
        key: process.env.HUGGINGFACE_API_KEY,
        freeLimit: { amount: 50, period: 'hourly' },
        currentUsage: 0,
        lastReset: new Date()
      }
    ],

    // Image APIs
    images: [
      {
        name: 'Unsplash (Mock)',
        url: 'https://api.unsplash.com',
        key: process.env.UNSPLASH_API_KEY,
        freeLimit: { amount: 50, period: 'hourly' },
        currentUsage: 0,
        lastReset: new Date()
      },
      {
        name: 'Picsum (Mock)',
        url: 'https://picsum.photos',
        freeLimit: { amount: Infinity, period: 'unlimited' },
        currentUsage: 0,
        lastReset: new Date()
      }
    ]
  };

  // Smart API selection with fallback
  async callAPI(category: string, request: any): Promise<any> {
    const apisInCategory = this.apis[category];
    
    if (!apisInCategory) {
      throw new Error(`No APIs available for category: ${category}`);
    }

    for (const api of apisInCategory) {
      if (!this.isUnderLimit(api)) {
        console.log(`⚠️ ${api.name} limit reached, trying next...`);
        continue;
      }

      try {
        const result = await this.makeRequest(api, request);
        api.currentUsage++;
        return result;
      } catch (error) {
        console.warn(`❌ ${api.name} failed:`, error);
        continue; // Try next API
      }
    }

    throw new Error(`All APIs in category ${category} failed or are rate-limited.`);
  }

  private isUnderLimit(api: APIConfig): boolean {
    this.resetIfNeeded(api);
    if (api.freeLimit.amount === Infinity) return true;
    return api.currentUsage < api.freeLimit.amount;
  }

  private resetIfNeeded(api: APIConfig) {
    const now = new Date();
    const elapsedMs = now.getTime() - api.lastReset.getTime();
    let periodMs = 0;

    switch(api.freeLimit.period) {
      case 'per-minute': periodMs = 60 * 1000; break;
      case 'hourly': periodMs = 60 * 60 * 1000; break;
      case 'daily': periodMs = 24 * 60 * 60 * 1000; break;
      case 'monthly': periodMs = 30 * 24 * 60 * 60 * 1000; break;
    }
    
    if (periodMs > 0 && elapsedMs >= periodMs) {
      console.log(`Resetting usage for ${api.name}`);
      api.currentUsage = 0;
      api.lastReset = now;
    }
  }

  private async makeRequest(api: APIConfig, request: any): Promise<any> {
    console.log(`MOCK: Calling API ${api.name} at ${api.url}`);
    // This is a mock implementation. In a real scenario, you'd use fetch with the correct headers and body.
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, from: api.name, data: "Mock API response" };
  }

  getUsageStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [category, apis] of Object.entries(this.apis)) {
      stats[category] = apis.map(api => ({
        name: api.name,
        usage: api.currentUsage,
        limit: api.freeLimit.amount,
        percentage: api.freeLimit.amount === Infinity 
          ? 0 
          : (api.currentUsage / api.freeLimit.amount) * 100
      }));
    }
    return stats;
  }
}

export const freeAPIManager = new FreeAPIManager();