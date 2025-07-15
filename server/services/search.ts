import axios from 'axios';
import { parse } from 'node-html-parser';

export interface SearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  credibilityScore: number;
}

export interface SearchService {
  searchClaim(query: string): Promise<SearchResult[]>;
  extractContent(url: string): Promise<string>;
  calculateCredibility(domain: string, content: string): number;
}

// Trusted news sources with credibility scores
const TRUSTED_DOMAINS = new Map([
  ['reuters.com', 95],
  ['apnews.com', 95],
  ['bbc.com', 92],
  ['cnn.com', 85],
  ['npr.org', 90],
  ['nytimes.com', 88],
  ['washingtonpost.com', 88],
  ['theguardian.com', 87],
  ['cbsnews.com', 85],
  ['nbcnews.com', 85],
  ['abcnews.go.com', 85],
  ['factcheck.org', 98],
  ['snopes.com', 95],
  ['politifact.com', 95],
  ['wikipedia.org', 80],
  ['nature.com', 95],
  ['sciencemag.org', 95],
  ['nejm.org', 98],
  ['who.int', 95],
  ['cdc.gov', 95],
  ['gov.uk', 90],
  ['usa.gov', 90],
]);

class GoogleSearchService implements SearchService {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async searchClaim(query: string): Promise<SearchResult[]> {
    try {
      // Clean and format the search query
      const searchQuery = encodeURIComponent(query.trim());
      const searchUrl = `https://www.google.com/search?q=${searchQuery}&num=10&hl=en`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000,
      });

      return this.parseGoogleResults(response.data);
    } catch (error) {
      console.error('Google search failed:', error);
      
      // Fallback to DuckDuckGo if Google fails
      return this.fallbackSearch(query);
    }
  }

  private parseGoogleResults(html: string): SearchResult[] {
    const root = parse(html);
    const results: SearchResult[] = [];

    // Parse Google search results
    const searchResults = root.querySelectorAll('div.g');
    
    for (const result of searchResults) {
      try {
        const titleElement = result.querySelector('h3');
        const linkElement = result.querySelector('a[href]');
        const snippetElement = result.querySelector('.VwiC3b') || result.querySelector('.s3v9rd');

        if (titleElement && linkElement && snippetElement) {
          const title = titleElement.text.trim();
          const url = linkElement.getAttribute('href') || '';
          const snippet = snippetElement.text.trim();
          
          // Clean URL (remove Google tracking)
          const cleanUrl = url.startsWith('/url?q=') 
            ? decodeURIComponent(url.split('&')[0].replace('/url?q=', ''))
            : url;

          if (cleanUrl.startsWith('http')) {
            const domain = new URL(cleanUrl).hostname.replace('www.', '');
            const credibilityScore = this.calculateCredibility(domain, snippet);

            results.push({
              title,
              url: cleanUrl,
              domain,
              snippet,
              credibilityScore,
            });
          }
        }
      } catch (error) {
        console.error('Error parsing search result:', error);
      }
    }

    return results.slice(0, 8); // Return top 8 results
  }

  private async fallbackSearch(query: string): Promise<SearchResult[]> {
    try {
      // Use DuckDuckGo as fallback
      const searchQuery = encodeURIComponent(query);
      const searchUrl = `https://duckduckgo.com/html/?q=${searchQuery}`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: 10000,
      });

      return this.parseDuckDuckGoResults(response.data);
    } catch (error) {
      console.error('Fallback search failed:', error);
      return [];
    }
  }

  private parseDuckDuckGoResults(html: string): SearchResult[] {
    const root = parse(html);
    const results: SearchResult[] = [];

    const searchResults = root.querySelectorAll('.result');
    
    for (const result of searchResults) {
      try {
        const titleElement = result.querySelector('.result__title a');
        const snippetElement = result.querySelector('.result__snippet');

        if (titleElement && snippetElement) {
          const title = titleElement.text.trim();
          const url = titleElement.getAttribute('href') || '';
          const snippet = snippetElement.text.trim();
          
          if (url.startsWith('http')) {
            const domain = new URL(url).hostname.replace('www.', '');
            const credibilityScore = this.calculateCredibility(domain, snippet);

            results.push({
              title,
              url,
              domain,
              snippet,
              credibilityScore,
            });
          }
        }
      } catch (error) {
        console.error('Error parsing DuckDuckGo result:', error);
      }
    }

    return results.slice(0, 8);
  }

  async extractContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: 10000,
        maxContentLength: 1024 * 1024, // 1MB limit
      });

      const root = parse(response.data);
      
      // Remove scripts and styles
      root.querySelectorAll('script, style, nav, footer, header, aside').forEach(el => el.remove());
      
      // Extract main content
      const content = root.querySelector('main') || 
                    root.querySelector('article') || 
                    root.querySelector('.content') ||
                    root.querySelector('#content') ||
                    root.querySelector('body');

      return content?.text.trim().substring(0, 2000) || '';
    } catch (error) {
      console.error('Content extraction failed:', error);
      return '';
    }
  }

  calculateCredibility(domain: string, content: string): number {
    // Base score from trusted domains
    let score = TRUSTED_DOMAINS.get(domain) || 50;
    
    // Adjust based on content quality indicators
    const contentLower = content.toLowerCase();
    
    // Positive indicators
    if (contentLower.includes('according to') || contentLower.includes('research shows')) score += 5;
    if (contentLower.includes('study') || contentLower.includes('data')) score += 5;
    if (contentLower.includes('expert') || contentLower.includes('professor')) score += 5;
    if (contentLower.includes('published') || contentLower.includes('peer-reviewed')) score += 10;
    
    // Negative indicators
    if (contentLower.includes('opinion') || contentLower.includes('believe')) score -= 5;
    if (contentLower.includes('rumor') || contentLower.includes('allegedly')) score -= 10;
    if (contentLower.includes('unconfirmed') || contentLower.includes('speculation')) score -= 10;
    
    // Domain-specific adjustments
    if (domain.includes('blog') || domain.includes('wordpress')) score -= 15;
    if (domain.includes('forum') || domain.includes('reddit')) score -= 20;
    if (domain.endsWith('.gov') || domain.endsWith('.edu')) score += 10;
    if (domain.endsWith('.org')) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
}

export const searchService = new GoogleSearchService();