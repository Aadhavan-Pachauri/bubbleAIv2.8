interface AgentTask {
  type: 'plan' | 'code' | 'test' | 'design' | 'assets';
  input: string;
  priority: number;
}

interface AgentResult {
  type: string;
  output: any;
  success: boolean;
  errors?: string[];
}

export class AgentOrchestrator {
  private activeAgents: Map<string, any> = new Map();

  // Detect if task needs multi-agent coordination
  needsOrchestration(prompt: string): boolean {
    const complexKeywords = [
      'build', 'create app', 'make a game',
      'full project', 'complete system'
    ];
    
    return complexKeywords.some(kw => prompt.toLowerCase().includes(kw));
  }

  // Coordinate multiple agents to complete complex task
  async orchestrate(prompt: string, onProgress?: (msg: string) => void): Promise<any> {
    const tasks = await this.analyzeAndBreakdown(prompt);
    
    onProgress?.('🤖 Coordinating specialized agents...');

    const agents = {
      plan: this.spawnAgent('plan'),
      code: this.spawnAgent('code'),
      test: this.spawnAgent('test'),
      design: this.spawnAgent('design'),
      assets: this.spawnAgent('assets')
    };

    const results = await this.executeParallel(tasks, agents, onProgress);
    const finalResult = await this.synthesize(results);

    return finalResult;
  }

  private async analyzeAndBreakdown(prompt: string): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];
    
    if (/build|create/i.test(prompt)) {
      tasks.push({ type: 'plan', input: `Plan: ${prompt}`, priority: 1 });
      tasks.push({ type: 'design', input: `Design UI for: ${prompt}`, priority: 2 });
      tasks.push({ type: 'assets', input: `Find assets for: ${prompt}`, priority: 3 });
      tasks.push({ type: 'code', input: `Code: ${prompt}`, priority: 4 });
      tasks.push({ type: 'test', input: `Test: ${prompt}`, priority: 5 });
    }
    
    return tasks;
  }

  private spawnAgent(type: string) {
    return {
      type,
      execute: async (task: AgentTask): Promise<AgentResult> => {
        // Each agent type has specialized logic (mocked here)
        console.log(`MOCK: Agent '${type}' is executing task: ${task.input}`);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
        
        switch(type) {
          case 'plan': return this.planningAgent(task);
          case 'code': return this.codingAgent(task);
          case 'test': return this.testingAgent(task);
          case 'design': return this.designAgent(task);
          case 'assets': return this.assetAgent(task);
          default: throw new Error(`Unknown agent type: ${type}`);
        }
      }
    };
  }

  private async executeParallel(
    tasks: AgentTask[],
    agents: Record<string, any>,
    onProgress?: (msg: string) => void
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    tasks.sort((a, b) => a.priority - b.priority);
    
    for (const task of tasks) {
      onProgress?.(`⚡ ${task.type} agent working...`);
      const agent = agents[task.type];
      if (!agent) continue;
      
      try {
        const result = await agent.execute(task);
        results.push(result);
        onProgress?.(result.success ? `✅ ${task.type} complete` : `⚠️ ${task.type} had issues`);
      } catch (error) {
        onProgress?.(`❌ ${task.type} failed`);
        results.push({ type: task.type, output: null, success: false, errors: [String(error)] });
      }
    }
    
    return results;
  }

  private async synthesize(results: AgentResult[]): Promise<any> {
    const successful = results.filter(r => r.success);
    const plan = successful.find(r => r.type === 'plan')?.output;
    const code = successful.find(r => r.type === 'code')?.output;
    const tests = successful.find(r => r.type === 'test')?.output;
    
    return {
      plan,
      code,
      tests,
      summary: `Completed ${successful.length}/${results.length} tasks successfully. Project is ready!`
    };
  }

  // MOCK: Specialized agent implementations
  private async planningAgent(task: AgentTask): Promise<AgentResult> {
    return { type: 'plan', output: 'Generated a detailed game design document.', success: true };
  }
  private async codingAgent(task: AgentTask): Promise<AgentResult> {
    return { type: 'code', output: { files: [{ path: 'main.lua', content: '-- Game code here' }] }, success: true };
  }
  private async testingAgent(task: AgentTask): Promise<AgentResult> {
    return { type: 'test', output: { tests: [{ name: 'Player spawn test', passed: true }] }, success: true };
  }
  private async designAgent(task: AgentTask): Promise<AgentResult> {
    return { type: 'design', output: { mockup: 'ui_mockup.png' }, success: true };
  }
  private async assetAgent(task: AgentTask): Promise<AgentResult> {
    return { type: 'assets', output: { images: ['car.png', 'tree.png'] }, success: true };
  }
}

export const orchestrator = new AgentOrchestrator();