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
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_RECENT_GIFS);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {}
  return [];
}

export function saveRecentGif(gif: GifItem): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const current = getRecentGifs();
      const updated = [gif, ...current.filter((g) => g.id !== gif.id)].slice(0, 24);
      localStorage.setItem(STORAGE_RECENT_GIFS, JSON.stringify(updated));
    }
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
    .replace(/\s+/g, ' ')
    .trim();
}

export const CATEGORY_SEARCH_MAP: Record<string, string> = {
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
 * Directly queries Google Tenor web catalog for live animated GIFs.
 * Works seamlessly in React Native without unsafe headers.
 */
async function fetchTenorDirectly(searchKey: string): Promise<GifItem[]> {
  const isTrending = !searchKey || searchKey.toLowerCase() === 'trending' || searchKey.toLowerCase() === 'all';
  const qSlug = isTrending ? '' : encodeURIComponent(searchKey.trim().toLowerCase().replace(/\s+/g, '-'));
  const urlsToTry = qSlug
    ? [`https://tenor.com/search/${qSlug}-gifs`, `https://tenor.com/search/${qSlug}`]
    : ['https://tenor.com'];

  for (const targetUrl of urlsToTry) {
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

      if (!res.ok) continue;
      const html = await res.text();
      const results: GifItem[] = [];
      const seen = new Set<string>();

      // Extract each <img> tag to avoid attribute-order limitations
      const imgTags = html.match(/<img\b[^>]*>/gi) || [];
      for (const tag of imgTags) {
        const srcMatch = tag.match(
          /src=["'](https:\/\/(?:media|c)\.tenor\.com\/[a-zA-Z0-9_-]+\/([a-zA-Z0-9_-]+)\.gif)["']/i
        );
        if (!srcMatch) continue;
        const fullUrl = srcMatch[1];
        const rawName = srcMatch[2] || 'gif';

        if (!seen.has(fullUrl)) {
          seen.add(fullUrl);
          const altMatch = tag.match(/alt=["']([^"']*)["']/i);
          const rawAlt = altMatch && altMatch[1] ? cleanHtmlEntities(altMatch[1]) : '';
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

      // Fallback regex if <img> tags didn't yield enough
      if (results.length < 5) {
        const rawRegex = /https:\/\/(?:media|c)\.tenor\.com\/[a-zA-Z0-9_-]+\/([a-zA-Z0-9_-]+)\.gif/g;
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

      if (results.length > 0) {
        return results;
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }

  return [];
}

/**
 * Directly queries Giphy (https://giphy.com/) for live animated GIFs.
 * Works seamlessly in React Native without unsafe headers.
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
export async function fetchOnlineGifs(query: string, category?: string, baseUrl?: string): Promise<GifItem[]> {
  const cleanQuery = (query || '').trim();
  const searchKey = cleanQuery
    ? cleanQuery
    : (category && CATEGORY_SEARCH_MAP[category]) || (category && category !== 'recents' && category !== 'all' ? category : 'trending');
  const cacheKey = searchKey.toLowerCase();

  const cached = clientGifCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Direct Global Search across both Google Tenor and Giphy in parallel
  try {
    const [tenorRes, giphyRes] = await Promise.allSettled([
      fetchTenorDirectly(searchKey),
      fetchGiphyDirectly(searchKey),
    ]);

    const tenorList = tenorRes.status === 'fulfilled' ? tenorRes.value : [];
    const giphyList = giphyRes.status === 'fulfilled' ? giphyRes.value : [];

    // Interleave Giphy and Tenor results for best diversity
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
    console.warn('Direct Tenor/Giphy search error:', err);
  }

  // 2. Proxy endpoint if baseUrl is configured
  if (baseUrl) {
    try {
      const endpoint = `${baseUrl.replace(/\/$/, '')}/api/v1/gifs/search`;
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(searchKey)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          clientGifCache.set(cacheKey, { timestamp: Date.now(), data });
          return data;
        }
      }
    } catch {
      // endpoint not available
    }
  }

  // 3. Multi-word fallback: try first word if multi-word query returned 0
  if (cleanQuery && cleanQuery.includes(' ')) {
    const firstWord = cleanQuery.split(/\s+/)[0];
    try {
      const [fTenor, fGiphy] = await Promise.allSettled([
        fetchTenorDirectly(firstWord),
        fetchGiphyDirectly(firstWord),
      ]);
      const fList = [
        ...(fGiphy.status === 'fulfilled' ? fGiphy.value : []),
        ...(fTenor.status === 'fulfilled' ? fTenor.value : []),
      ];
      if (fList.length > 0) {
        clientGifCache.set(cacheKey, { timestamp: Date.now(), data: fList });
        return fList;
      }
    } catch {}
  }

  return [];
}

