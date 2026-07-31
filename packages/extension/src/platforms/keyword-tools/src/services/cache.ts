interface CacheEntry {
  timestamp: number;
  response: any;
}

class CacheManager {
  private cacheTime = 24 * 3600 * 1000; // 24 hours
  private cache: Record<string, CacheEntry> = {};

  get(url: string): any {
    const now = Date.now();
    const entry = this.cache[url];
    if (entry && now - entry.timestamp <= this.cacheTime) {
      return entry.response;
    } else {
      delete this.cache[url];
    }
    return false;
  }

  set(url: string, response: any): void {
    const now = Date.now();
    const entry = this.cache[url];
    if (entry && now - entry.timestamp <= this.cacheTime) {
      return;
    }

    this.cache[url] = {
      timestamp: now,
      response: response
    };

    setTimeout(() => {
      delete this.cache[url];
    }, this.cacheTime);
  }

  clear(): void {
    this.cache = {};
  }
}

export const Cache = new CacheManager();
export default Cache;
