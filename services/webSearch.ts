
interface SearchResult {
    title: string;
    snippet: string;
    url: string;
}

export class WebSearch {
    async search(query: string): Promise<SearchResult[]> {
        try {
            // Use the spec-provided URL format
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`DuckDuckGo API returned status ${response.status}`);
            }
            const data = await response.json();
            const results: SearchResult[] = [];

            // Main answer
            if (data.Abstract) {
                results.push({
                    title: data.Heading || 'Summary',
                    snippet: data.Abstract,
                    url: data.AbstractURL,
                });
            }

            // Related topics
            data.RelatedTopics?.slice(0, 3).forEach((topic: any) => {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        title: topic.Text.substring(0, 80),
                        snippet: topic.Text,
                        url: topic.FirstURL,
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('DuckDuckGo search error:', error);
            return [];
        }
    }

    formatForContext(results: SearchResult[]): string {
        if (!results || results.length === 0) {
            return '';
        }

        return `
WEB SEARCH RESULTS:
${results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.url}`).join('\n\n')}
    `.trim();
    }
}
