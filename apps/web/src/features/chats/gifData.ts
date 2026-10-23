/**
 * WhatsApp-style GIF Data & Utilities
 * Provides curated animated GIFs categorized by emotion, trending, and reaction,
 * full-text search indexing, recents storage, and multi-CDN fallback helpers.
 */

export interface GifItem {
  id: string;
  title: string;
  category: 'trending' | 'reactions' | 'applause' | 'dancing' | 'thumbsup' | 'love' | 'sad' | 'mindblown' | 'party' | 'coffee';
  url: string;
  previewUrl?: string;
  tags: string[];
}

export interface GifCategory {
  id: string;
  name: string;
  icon: string;
}

export const GIF_CATEGORIES: GifCategory[] = [
  { id: 'trending', name: 'Trending', icon: '🔥' },
  { id: 'reactions', name: 'Reactions', icon: '😂' },
  { id: 'applause', name: 'Clapping', icon: '👏' },
  { id: 'dancing', name: 'Dancing', icon: '💃' },
  { id: 'thumbsup', name: 'Thumbs Up', icon: '👍' },
  { id: 'love', name: 'Love', icon: '❤️' },
  { id: 'sad', name: 'Sad', icon: '😢' },
  { id: 'mindblown', name: 'Mind Blown', icon: '🤯' },
  { id: 'party', name: 'Party', icon: '🎉' },
  { id: 'coffee', name: 'Chill & Vibe', icon: '☕' },
];

export const STORAGE_RECENT_GIFS = 'chat_recent_gifs';

/**
 * Returns alternative CDN URLs for a Giphy GIF to ensure 100% reliability
 * across all networks, devices, and DNS resolvers.
 */
export function getGiphyFallbacks(url: string): string[] {
  if (!url) return [];
  const fallbacks: string[] = [url];

  // Tenor CDN Fallback (media.tenor.com <-> c.tenor.com)
  if (url.includes('media.tenor.com')) {
    const cUrl = url.replace('media.tenor.com', 'c.tenor.com');
    if (!fallbacks.includes(cUrl)) fallbacks.push(cUrl);
  } else if (url.includes('c.tenor.com')) {
    const mediaUrl = url.replace('c.tenor.com', 'media.tenor.com');
    if (!fallbacks.includes(mediaUrl)) fallbacks.push(mediaUrl);
  }

  // Extract Giphy ID if present
  const idMatch = url.match(/(?:giphy\.com\/media\/|i\.giphy\.com\/|media\d?\.giphy\.com\/media\/)([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    const id = idMatch[1].replace(/\.gif$/, '');
    const variants = [
      `https://media.giphy.com/media/${id}/giphy.gif`,
      `https://media1.giphy.com/media/${id}/giphy.gif`,
      `https://media2.giphy.com/media/${id}/giphy.gif`,
      `https://i.giphy.com/${id}.gif`,
      `https://i.giphy.com/media/${id}/giphy.gif`,
    ];
    for (const v of variants) {
      if (!fallbacks.includes(v)) {
        fallbacks.push(v);
      }
    }
  }

  return fallbacks;
}

// Static curated GIFs removed - all GIFs are fetched dynamically from the web!
export const CURATED_GIFS: GifItem[] = [];

// Storage Helpers
export function getRecentGifs(): GifItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_GIFS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentGif(gif: GifItem): void {
  try {
    const current = getRecentGifs();
    const updated = [gif, ...current.filter((g) => g.id !== gif.id)].slice(0, 24);
    localStorage.setItem(STORAGE_RECENT_GIFS, JSON.stringify(updated));
  } catch {
    // Ignore quota issues
  }
}

export function searchGifsLocally(_query: string): GifItem[] {
  return [];
}

export function getGifsByCategory(_category: string): GifItem[] {
  return [];
}

export function searchGifs(_query: string, _category?: string): GifItem[] {
  return [];
}

const clientGifCache = new Map<string, { timestamp: number; data: GifItem[] }>();
const CLIENT_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function cleanHtmlEntities(str: string): string {
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Directly queries Google Tenor web endpoint for dynamic animated GIFs matching query or trending.
 */
async function fetchTenorDirectly(searchKey: string): Promise<GifItem[]> {
  const isTrending = !searchKey || searchKey.toLowerCase() === 'trending' || searchKey.toLowerCase() === 'all';
  const qSlug = isTrending ? '' : encodeURIComponent(searchKey.trim().toLowerCase().replace(/\s+/g, '-'));
  const targetUrl = qSlug ? `https://tenor.com/search/${qSlug}-gifs` : 'https://tenor.com';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const html = await res.text();
    const results: GifItem[] = [];
    const seen = new Set<string>();

    const imgRegex =
      /<img\b[^>]*\bsrc=["'](https:\/\/media\.tenor\.com\/[a-zA-Z0-9_-]+\/([a-zA-Z0-9_-]+)\.gif)["'][^>]*\balt=["']([^"']*)["']/gi;
    let m: RegExpExecArray | null;

    while ((m = imgRegex.exec(html)) !== null) {
      const fullUrl = m[1];
      const rawName = m[2] || 'gif';
      const rawAlt = m[3] ? cleanHtmlEntities(m[3]) : '';

      if (!seen.has(fullUrl)) {
        seen.add(fullUrl);
        const fallbackTitle = rawName
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const title = rawAlt.length > 3 ? rawAlt : fallbackTitle;

        results.push({
          id: `tenor-${Math.random().toString(36).substring(2, 9)}`,
          title,
          category: 'trending',
          url: fullUrl,
          tags: [searchKey, ...rawName.split(/[-_]+/)],
        });
      }
    }

    if (results.length === 0) {
      const rawRegex =
        /https:\/\/media\.tenor\.com\/[a-zA-Z0-9_-]+\/([a-zA-Z0-9_-]+)\.gif/g;
      let rawMatch: RegExpExecArray | null;

      while ((rawMatch = rawRegex.exec(html)) !== null) {
        const fullUrl = rawMatch[0];
        const rawName = rawMatch[1] || 'gif';
        if (!seen.has(fullUrl)) {
          seen.add(fullUrl);
          const title = rawName
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          results.push({
            id: `tenor-${Math.random().toString(36).substring(2, 9)}`,
            title,
            category: 'trending',
            url: fullUrl,
            tags: [searchKey, ...rawName.split(/[-_]+/)],
          });
        }
      }
    }

    return results;
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}

const CATEGORY_SEARCH_MAP: Record<string, string> = {
  trending: 'trending',
  reactions: 'funny reaction',
  applause: 'applause clapping',
  dancing: 'dance dancing',
  thumbsup: 'thumbs up',
  love: 'love heart',
  sad: 'sad crying',
  mindblown: 'mind blown',
  party: 'party celebrate',
  coffee: 'chill vibe coffee',
};

/**
 * Directly queries Giphy (https://giphy.com/) for live animated GIFs.
 */
async function fetchGiphyDirectly(searchKey: string): Promise<GifItem[]> {
  const isTrending = !searchKey || searchKey.toLowerCase() === 'trending' || searchKey.toLowerCase() === 'all';
  const qSlug = isTrending ? '' : encodeURIComponent(searchKey.trim().toLowerCase().replace(/\s+/g, '-'));
  const targetUrl = qSlug ? `https://giphy.com/search/${qSlug}` : 'https://giphy.com/trending-gifs';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const html = await res.text();
    const results: GifItem[] = [];
    const seen = new Set<string>();

    const linkRegex = /https:\/\/giphy\.com\/gifs\/(?:[a-zA-Z0-9_-]+-)?([a-zA-Z0-9]{10,30})\b/g;
    let m: RegExpExecArray | null;

    while ((m = linkRegex.exec(html)) !== null) {
      const fullLink = m[0];
      const gifId = m[1];
      if (!seen.has(gifId)) {
        seen.add(gifId);
        const slugPart = fullLink.replace('https://giphy.com/gifs/', '').replace('-' + gifId, '');
        const title = slugPart
          ? cleanHtmlEntities(slugPart.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
          : (searchKey || 'GIF');

        results.push({
          id: `giphy-${gifId}`,
          title,
          category: 'trending',
          url: `https://media.giphy.com/media/${gifId}/giphy.gif`,
          previewUrl: `https://media.giphy.com/media/${gifId}/200.gif`,
          tags: [searchKey, ...slugPart.split(/[-_]+/)],
        });
      }
    }

    return results;
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
}

/**
 * Searches online GIFs powered dynamically by Google Tenor AND Giphy (https://giphy.com/).
 * Queries both platforms in parallel and combines results.
 * Completely dynamic - no static curated lists.
 */
export async function fetchOnlineGifs(query: string, category?: string): Promise<GifItem[]> {
  const cleanQuery = (query || '').trim();
  const searchKey = cleanQuery
    ? cleanQuery
    : (category && CATEGORY_SEARCH_MAP[category]) || (category && category !== 'recents' && category !== 'all' ? category : 'trending');
  const cacheKey = searchKey.toLowerCase();

  const cached = clientGifCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Try local dev proxy endpoint if available
  try {
    const res = await fetch(`/api/v1/gifs/search?q=${encodeURIComponent(searchKey)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        clientGifCache.set(cacheKey, { timestamp: Date.now(), data });
        return data;
      }
    }
  } catch {
    // Continue to direct search
  }

  // 2. Direct parallel search across Tenor and Giphy
  try {
    const [tenorRes, giphyRes] = await Promise.allSettled([
      fetchTenorDirectly(searchKey),
      fetchGiphyDirectly(searchKey),
    ]);

    const tenorList = tenorRes.status === 'fulfilled' ? tenorRes.value : [];
    const giphyList = giphyRes.status === 'fulfilled' ? giphyRes.value : [];

    const combined: GifItem[] = [];
    const maxLen = Math.max(tenorList.length, giphyList.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < giphyList.length) combined.push(giphyList[i]);
      if (i < tenorList.length) combined.push(tenorList[i]);
    }

    if (combined.length > 0) {
      clientGifCache.set(cacheKey, { timestamp: Date.now(), data: combined });
      return combined;
    }
  } catch (err) {
    console.warn('Direct Tenor/Giphy GIF search error:', err);
  }

  return [];
}

