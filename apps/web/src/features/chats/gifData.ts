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

export const CURATED_GIFS: GifItem[] = [
  // Trending
  {
    id: 'gif-gatsby-cheers',
    title: 'Gatsby Cheers',
    category: 'trending',
    url: 'https://media.giphy.com/media/BPJmHPINuydyU/giphy.gif',
    tags: ['gatsby', 'cheers', 'champagne', 'leonardo', 'celebration', 'toast', 'classy', 'congrats', 'party']
  },
  {
    id: 'gif-this-is-fine',
    title: 'This Is Fine Dog',
    category: 'trending',
    url: 'https://media.giphy.com/media/NTur7XlVDUdqM/giphy.gif',
    tags: ['this is fine', 'dog', 'fire', 'okay', 'chaos', 'calm', 'meme', 'help', 'fine']
  },
  {
    id: 'gif-elmo-fire',
    title: 'Elmo Hell Fire',
    category: 'trending',
    url: 'https://media.giphy.com/media/yr7n0u3WoS996/giphy.gif',
    tags: ['elmo', 'fire', 'chaos', 'flames', 'rise', 'epic', 'trending', 'wild', 'burn']
  },
  {
    id: 'gif-success-kid',
    title: 'Success Kid Yes',
    category: 'trending',
    url: 'https://media.giphy.com/media/nXxOjZrbnbRxS/giphy.gif',
    tags: ['success', 'kid', 'beach', 'fist', 'yes', 'win', 'victory', 'nailed it', 'done']
  },

  // Reactions
  {
    id: 'gif-minion-laugh',
    title: 'Minion Laughing Hard',
    category: 'reactions',
    url: 'https://media.giphy.com/media/B0vFTrb0ZGDf2/giphy.gif',
    tags: ['minion', 'laugh', 'lol', 'haha', 'rofl', 'funny', 'joke', 'hysterical', 'lmao']
  },
  {
    id: 'gif-robert-nod',
    title: 'Nodding In Agreement',
    category: 'reactions',
    url: 'https://media.giphy.com/media/gOkawaguYpl5C/giphy.gif',
    tags: ['nod', 'yes', 'agree', 'robert redford', 'mountain', 'smile', 'respect', 'approved', 'ok', 'sure']
  },
  {
    id: 'gif-picard-facepalm',
    title: 'Captain Picard Facepalm',
    category: 'reactions',
    url: 'https://media.giphy.com/media/XsUmnZXagUBUs/giphy.gif',
    tags: ['facepalm', 'picard', 'star trek', 'smh', 'disappointed', 'fail', 'dumb', 'seriously']
  },
  {
    id: 'gif-forrest-wave',
    title: 'Forrest Gump Waving',
    category: 'reactions',
    url: 'https://media.giphy.com/media/keTwQbbQwlNM20Js3W/giphy.gif',
    tags: ['wave', 'hello', 'hi', 'bye', 'forrest gump', 'boat', 'friendly', 'hey', 'welcome']
  },
  {
    id: 'gif-mic-drop',
    title: 'Obama Mic Drop',
    category: 'reactions',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    tags: ['mic drop', 'obama', 'boom', 'done', 'winner', 'period', 'statement', 'flex']
  },

  // Applause / Clapping
  {
    id: 'gif-leo-clap',
    title: 'Leonardo Clapping Applause',
    category: 'applause',
    url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
    tags: ['applause', 'clap', 'clapping', 'leonardo', 'wolf of wall street', 'bravo', 'congrats', 'cheers']
  },
  {
    id: 'gif-standing-ovation',
    title: 'Standing Ovation Bravo',
    category: 'applause',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    tags: ['ovation', 'applause', 'cheer', 'respect', 'well done', 'bravo', 'clapping', 'proud']
  },

  // Dancing
  {
    id: 'gif-carlton-dance',
    title: 'Carlton Dance Fresh Prince',
    category: 'dancing',
    url: 'https://media.giphy.com/media/4bjIKBOWUnVPICC8JCE/giphy.gif',
    tags: ['carlton', 'dance', 'fresh prince', 'happy', 'groove', 'moves', 'celebrate', 'dancing']
  },
  {
    id: 'gif-happy-dog-dance',
    title: 'Happy Dog Dancing',
    category: 'dancing',
    url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    tags: ['dog', 'dance', 'cute', 'excited', 'wiggle', 'happy', 'tail', 'puppy', 'pet']
  },

  // Thumbs Up
  {
    id: 'gif-thumbs-up-classic',
    title: 'Cool Thumbs Up',
    category: 'thumbsup',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    tags: ['thumbs up', 'like', 'agree', 'cool', 'good', 'affirmative', 'ok', 'nice', 'great', 'yes']
  },

  // Love & Heart
  {
    id: 'gif-heart-hands',
    title: 'Heart Hands Love',
    category: 'love',
    url: 'https://media.giphy.com/media/26BRv0ThflsDTjCTe/giphy.gif',
    tags: ['heart', 'love', 'sweet', 'hands', 'crush', 'care', 'romance', 'thank you', 'kiss']
  },

  // Mind Blown
  {
    id: 'gif-mind-blown',
    title: 'Mind Blown Galaxy',
    category: 'mindblown',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
    tags: ['mind blown', 'brain', 'space', 'galaxy', 'whoa', 'insane', 'shocking', 'unbelievable', 'omg']
  },

  // Sad / Crying
  {
    id: 'gif-crying-waterfall',
    title: 'Crying In Sadness',
    category: 'sad',
    url: 'https://media.giphy.com/media/L95W4wvNFOKR2/giphy.gif',
    tags: ['sad', 'crying', 'tears', 'upset', 'heartbroken', 'sob', 'pain', 'sorry']
  },

  // Party
  {
    id: 'gif-party-confetti',
    title: 'Confetti Party Celebrate',
    category: 'party',
    url: 'https://media.giphy.com/media/BPJmHPINuydyU/giphy.gif',
    tags: ['party', 'celebrate', 'congrats', 'cheers', 'birthday', 'champagne', 'yay', 'friday']
  },

  // Coffee / Chill
  {
    id: 'gif-chill-vibe',
    title: 'Chill Coffee Morning',
    category: 'coffee',
    url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
    tags: ['chill', 'coffee', 'loading', 'relax', 'zen', 'morning', 'vibe', 'tea']
  }
];

// Storage Helpers
export function getRecentGifs(): GifItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_GIFS);
    return raw ? JSON.parse(raw) : [CURATED_GIFS[0], CURATED_GIFS[1], CURATED_GIFS[4]];
  } catch {
    return [CURATED_GIFS[0], CURATED_GIFS[1], CURATED_GIFS[4]];
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

/**
 * Fast search over curated GIFs by keyword or category
 */
export function searchGifs(query: string, category?: string): GifItem[] {
  let list = CURATED_GIFS;

  if (category && category !== 'all' && category !== 'trending') {
    list = list.filter((g) => g.category === category);
  }

  if (!query || !query.trim()) {
    return list;
  }

  const q = query.trim().toLowerCase();
  return list.filter((g) => {
    if (g.title.toLowerCase().includes(q)) return true;
    if (g.category.toLowerCase().includes(q)) return true;
    return g.tags.some((tag) => tag.toLowerCase().includes(q));
  });
}

const clientGifCache = new Map<string, { timestamp: number; data: GifItem[] }>();
const CLIENT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Searches online GIFs powered by Google Tenor via our live search endpoint.
 * Returns animated GIFs matching the typed query word or category.
 * If network request fails or device is offline, gracefully falls back to local curated items.
 */
export async function fetchOnlineGifs(query: string, category?: string): Promise<GifItem[]> {
  const cleanQuery = (query || '').trim();
  const searchKey = cleanQuery || (category && category !== 'recents' && category !== 'all' ? category : 'trending');
  const cacheKey = searchKey.toLowerCase();

  const cached = clientGifCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(`/api/v1/gifs/search?q=${encodeURIComponent(searchKey)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        clientGifCache.set(cacheKey, { timestamp: Date.now(), data });
        return data;
      }
    }
  } catch (err) {
    console.warn('Google Tenor GIF search error, falling back to local list:', err);
  }

  // Graceful fallback to curated GIFs if network fails or yields no results
  return searchGifs(cleanQuery, category);
}

