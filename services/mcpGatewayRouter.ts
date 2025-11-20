// This file manages all 6 MCP gateways and routes requests intelligently

import { MCPRequest } from '../types';

interface Gateway {
  name: string;
  url: string;
  port: number;
  strengths: string[];
  maxLoad: number;
  currentLoad: number;
  healthy: boolean;
}

export class MCPGatewayRouter {
  private gateways: Gateway[] = [
    {
      name: '1MCP',
      url: 'http://localhost:3050',
      port: 3050,
      strengths: ['fast', 'simple', 'development', 'tags'],
      maxLoad: 100,
      currentLoad: 0,
      healthy: true
    },
    {
      name: 'MetaMCP',
      url: 'http://localhost:3000',
      port: 3000,
      strengths: ['docker', 'middleware', 'production', 'namespaces'],
      maxLoad: 200,
      currentLoad: 0,
      healthy: true
    },
    {
      name: 'MCP Hub',
      url: 'http://localhost:3001',
      port: 3001,
      strengths: ['rest', 'workspace', 'dynamic', 'sse'],
      maxLoad: 150,
      currentLoad: 0,
      healthy: true
    },
    {
      name: 'Envoy AI',
      url: 'http://localhost:8080',
      port: 8080,
      strengths: ['scale', 'enterprise', 'kubernetes', 'multiplexing'],
      maxLoad: 500,
      currentLoad: 0,
      healthy: true
    },
    {
      name: 'Docker Gateway',
      url: 'http://localhost:8081',
      port: 8081,
      strengths: ['security', 'containers', 'isolation', 'official'],
      maxLoad: 300,
      currentLoad: 0,
      healthy: true
    },
    {
      name: 'TrueFoundry',
      url: 'http://localhost:9000',
      port: 9000,
      strengths: ['enterprise', 'observability', 'reliability', 'portal'],
      maxLoad: 400,
      currentLoad: 0,
      healthy: true
    }
  ];

  // Categorize request and route to best gateway
  async routeRequest(request: MCPRequest): Promise<any> {
    const requestType = this.categorizeRequest(request);
    const gateway = await this.selectGateway(requestType);
    
    return await this.executeRequest(gateway, request);
  }

  // Determine request type
  private categorizeRequest(request: MCPRequest): string {
    const { prompt } = request;

    if (/search|lookup|find|quick/i.test(prompt)) {
      return 'FAST_QUERY';
    }
    if (/deploy|publish|production|release/i.test(prompt)) {
      return 'PRODUCTION_TASK';
    }
    if (/scrape|research|analyze|deep/i.test(prompt)) {
      return 'HEAVY_SCRAPING';
    }
    if (/login|auth|secure|private|sensitive/i.test(prompt)) {
      return 'SECURE_OPERATION';
    }
    if (/build|create|complex|workflow|agents/i.test(prompt)) {
      return 'MULTI_AGENT';
    }

    return 'GENERAL';
  }

  // Select best gateway based on request type
  private async selectGateway(requestType: string): Promise<Gateway> {
    const strengthsMap: Record<string, string[]> = {
      'FAST_QUERY': ['fast', 'simple'],
      'PRODUCTION_TASK': ['production', 'enterprise'],
      'HEAVY_SCRAPING': ['scale', 'kubernetes'],
      'SECURE_OPERATION': ['security', 'enterprise'],
      'MULTI_AGENT': ['orchestration', 'workspace'],
      'GENERAL': ['fast', 'simple']
    };

    const requiredStrengths = strengthsMap[requestType] || ['fast'];
    
    const candidates = this.gateways.filter(gw => 
      gw.healthy && 
      requiredStrengths.some(s => gw.strengths.includes(s))
    );

    if (candidates.length === 0) {
      // Fallback to any healthy gateway
      const healthy = this.gateways.filter(gw => gw.healthy);
      if (healthy.length > 0) return healthy[0];
      throw new Error("All MCP gateways are currently unhealthy.");
    }

    // Return gateway with lowest load
    return candidates.reduce((best, current) => 
      (current.currentLoad / current.maxLoad) < (best.currentLoad / best.maxLoad) ? current : best
    );
  }

  // Execute request through selected gateway
  private async executeRequest(gateway: Gateway, request: MCPRequest): Promise<any> {
    console.log(`🎯 Routing to ${gateway.name} (${gateway.url})`);
    
    try {
      gateway.currentLoad++;
      
      // MOCK: This fetch will fail as the servers are not running in this environment.
      // In a real app, this would make a network request.
      console.log(`Simulating POST to ${gateway.url}/mcp with prompt: "${request.prompt}"`);
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      // throw new Error("Simulated network failure"); // Uncomment to test retry logic
      
      gateway.currentLoad--;
      
      return { 
        content: `Mock response from ${gateway.name} for prompt: "${request.prompt}"`,
        tools: [gateway.name]
      };

    } catch (error) {
      gateway.healthy = false;
      gateway.currentLoad--;
      
      // Retry with different gateway
      console.warn(`❌ ${gateway.name} failed, retrying...`);
      return this.retryWithFallback(request, gateway.name);
    }
  }

  // Retry with different gateway
  private async retryWithFallback(request: MCPRequest, failedGateway: string): Promise<any> {
    const alternateGateway = this.gateways.find(
      gw => gw.healthy && gw.name !== failedGateway
    );

    if (!alternateGateway) {
      throw new Error('All gateways unavailable');
    }

    console.log(`🔄 Fallback to ${alternateGateway.name}`);
    return this.executeRequest(alternateGateway, request);
  }

  // Health check all gateways
  async healthCheckAll(): Promise<void> {
    for (const gateway of this.gateways) {
      try {
        // MOCK: In a real app, this would make a network request.
        gateway.healthy = Math.random() > 0.1; // 90% chance of being healthy
      } catch {
        gateway.healthy = false;
      }
    }
  }

  // Get status of all gateways
  getStatus(): (Gateway & { loadPercentage: number })[] {
    return this.gateways.map(gw => ({
      ...gw,
      loadPercentage: (gw.currentLoad / gw.maxLoad) * 100
    }));
  }
}

// Export singleton instance
export const mcpRouter = new MCPGatewayRouter();