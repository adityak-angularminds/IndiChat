/**
 * WhatsApp-style Stickers Data & Utilities
 * Provides rich categorized sticker packs, search indexing, custom sticker storage,
 * and recents/favorites management.
 */

export interface StickerItem {
  id: string;
  name: string;
  category: 'reactions' | 'animals' | 'chibi' | 'desi' | 'classics' | 'custom' | 'recent' | 'favorites';
  url: string; // SVG data URL, upload URL, or image URL
  tags: string[];
  isCustom?: boolean;
}

export interface StickerPack {
  id: string;
  name: string;
  icon: string;
  stickers: StickerItem[];
}

// Storage keys
export const STORAGE_CUSTOM_STICKERS = 'chat_custom_stickers';
export const STORAGE_STARRED_STICKERS = 'chat_starred_stickers';
export const STORAGE_RECENT_STICKERS = 'chat_recent_stickers';

// Helper to create crisp, high-aesthetic SVG Data URLs for stickers
function makeSvgDataUri(svgContent: string): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

// 1. Reactions & Memes Pack
const REACTIONS_STICKERS: StickerItem[] = [
  {
    id: 'stk-laugh-cry',
    name: 'Laughing Tears',
    category: 'reactions',
    tags: ['laugh', 'lol', 'haha', 'crying', 'tears', 'funny', 'joke', 'rofl'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="54" fill="#FFCC4D" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"/>
      <path d="M26 44c4-7 15-9 22-4M72 40c7-5 18-3 22 4" stroke="#664500" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M30 62c6 18 54 18 60 0-4-3-56-3-60 0z" fill="#664500"/>
      <path d="M40 63c4 8 36 8 40 0" fill="#fff"/>
      <path d="M45 72c3 6 27 6 30 0" fill="#E24A5E"/>
      <ellipse cx="20" cy="62" rx="7" ry="12" fill="#5DADEC" transform="rotate(-20 20 62)"/>
      <ellipse cx="100" cy="62" rx="7" ry="12" fill="#5DADEC" transform="rotate(20 100 62)"/>
    `)
  },
  {
    id: 'stk-mind-blown',
    name: 'Mind Blown',
    category: 'reactions',
    tags: ['mind blown', 'shocked', 'explosion', 'brain', 'omg', 'wow', 'insane'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="70" r="44" fill="#FFCC4D"/>
      <!-- Mushroom cloud/explosion -->
      <path d="M32 46c-10-8-2-24 10-20 6-12 24-14 30-4 10-10 26 2 20 16 10 6 6 22-8 20-8 6-44 6-52-12z" fill="#FF7844"/>
      <circle cx="48" cy="24" r="14" fill="#FFD034"/>
      <circle cx="70" cy="22" r="16" fill="#FFA534"/>
      <circle cx="60" cy="36" r="12" fill="#FF4F34"/>
      <circle cx="46" cy="74" r="7" fill="#664500"/>
      <circle cx="74" cy="74" r="7" fill="#664500"/>
      <ellipse cx="60" cy="94" rx="14" ry="10" fill="#664500"/>
    `)
  },
  {
    id: 'stk-fire-lit',
    name: 'Lit Fire',
    category: 'reactions',
    tags: ['fire', 'lit', 'flame', 'hot', 'epic', 'awesome', 'trend'],
    url: makeSvgDataUri(`
      <path d="M60 8c4 16 18 24 24 38 8 18 2 40-14 54-18 16-48 10-56-14-6-18 2-34 16-46 3 14 10 22 18 20 4-14 0-32 12-52z" fill="#FF5722"/>
      <path d="M60 38c2 10 12 16 16 26 4 12 0 26-10 34-12 10-30 6-36-8-4-12 2-22 10-30 2 8 6 14 12 12 2-8 0-22 8-34z" fill="#FF9800"/>
      <path d="M60 62c2 6 8 10 10 16 2 8 0 16-6 20-8 6-18 4-22-4-2-8 2-14 6-18 2 4 4 8 8 8 2-6 0-14 4-22z" fill="#FFEB3B"/>
    `)
  },
  {
    id: 'stk-cool-sunglasses',
    name: 'Cool Shades',
    category: 'reactions',
    tags: ['cool', 'shades', 'sunglasses', 'boss', 'swag', 'chill'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="54" fill="#FFCC4D"/>
      <!-- Sunglasses -->
      <path d="M18 44h84v4c0 14-10 24-24 24h-4c-10 0-16-6-14-14-2 8-8 14-18 14h-4C24 72 18 62 18 48z" fill="#292F33"/>
      <path d="M22 48h28c-2 16-10 20-22 20-4 0-6-6-6-20z" fill="#66757F" opacity="0.6"/>
      <path d="M70 48h28c-2 16-10 20-22 20-4 0-6-6-6-20z" fill="#66757F" opacity="0.6"/>
      <path d="M40 82c8 10 32 10 40 0" stroke="#664500" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    `)
  },
  {
    id: 'stk-rocket',
    name: 'Rocket Blast',
    category: 'reactions',
    tags: ['rocket', 'space', 'to the moon', 'launch', 'fast', 'success', 'crypto'],
    url: makeSvgDataUri(`
      <path d="M84 16c-18-2-44 14-52 38l14 14c24-8 40-34 38-52z" fill="#E1E8ED"/>
      <path d="M84 16c-8 0-26 8-38 20l18 18c12-12 20-30 20-38z" fill="#DD2E44"/>
      <circle cx="66" cy="34" r="7" fill="#55ACEE"/>
      <path d="M32 54l-14 8 8 14 10-4z" fill="#AA8DD8"/>
      <path d="M66 88l8-14-4-10-8 14z" fill="#AA8DD8"/>
      <path d="M26 74l-16 6 6-16c-4 12-2 18 10 10z" fill="#FFAC33"/>
      <circle cx="16" cy="84" r="8" fill="#FF5722"/>
    `)
  },
  {
    id: 'stk-heart-eyes',
    name: 'Love Heart Eyes',
    category: 'reactions',
    tags: ['love', 'heart', 'crush', 'in love', 'heart eyes', 'romantic', 'beautiful', 'cute'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="54" fill="#FFCC4D"/>
      <!-- Heart eye 1 -->
      <path d="M40 36c-6-8-18-4-18 6 0 10 18 20 18 20s18-10 18-20c0-10-12-14-18-6z" fill="#DD2E44"/>
      <!-- Heart eye 2 -->
      <path d="M80 36c-6-8-18-4-18 6 0 10 18 20 18 20s18-10 18-20c0-10-12-14-18-6z" fill="#DD2E44"/>
      <path d="M36 78c6 14 42 14 48 0" stroke="#664500" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    `)
  },
  {
    id: 'stk-party-popper',
    name: 'Party Celebration',
    category: 'reactions',
    tags: ['party', 'popper', 'celebrate', 'congrats', 'birthday', 'yay', 'hooray'],
    url: makeSvgDataUri(`
      <path d="M24 96l14-48 34 34z" fill="#F4900C"/>
      <path d="M24 96l8-28 20 20z" fill="#FFCC4D"/>
      <!-- Confetti streamers -->
      <circle cx="76" cy="30" r="6" fill="#DD2E44"/>
      <circle cx="94" cy="48" r="5" fill="#5DADEC"/>
      <circle cx="64" cy="18" r="5" fill="#77B255"/>
      <path d="M54 36c12-14 30-8 40-4" stroke="#A0041E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M42 22c8-8 22-4 28 6" stroke="#007ACC" stroke-width="3" fill="none" stroke-linecap="round"/>
      <polygon points="86,20 92,26 84,28" fill="#FFCC4D"/>
      <polygon points="102,36 108,40 102,46" fill="#77B255"/>
    `)
  },
  {
    id: 'stk-thumbs-up',
    name: 'Golden Thumbs Up',
    category: 'reactions',
    tags: ['thumbs up', 'like', 'agree', 'yes', 'good', 'approved', 'nice', 'ok'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="52" fill="#00A884"/>
      <path d="M42 84h-8a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h8v36zm10-36c0-6 4-18 10-18 6 0 8 6 6 12l-4 10h22c6 0 10 5 9 11l-4 20c-1 5-6 9-11 9H52V48z" fill="#ffffff"/>
    `)
  },
  {
    id: 'stk-100-score',
    name: '100 Percent',
    category: 'reactions',
    tags: ['100', 'hundred', 'perfect', 'score', 'lit', 'facts', 'true'],
    url: makeSvgDataUri(`
      <rect width="108" height="74" x="6" y="24" rx="14" fill="#DD2E44"/>
      <text x="60" y="66" font-family="Arial, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" letter-spacing="1">100</text>
      <line x1="22" y1="78" x2="98" y2="78" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="22" y1="86" x2="98" y2="86" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
    `)
  },
  {
    id: 'stk-crying-sad',
    name: 'Sad Crying',
    category: 'reactions',
    tags: ['sad', 'crying', 'sob', 'depressed', 'unhappy', 'tear', 'upset'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="54" fill="#FFCC4D"/>
      <path d="M34 44c4 4 14 4 18 0M68 44c4 4 14 4 18 0" stroke="#664500" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M40 84c6-14 34-14 40 0" stroke="#664500" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M38 52c-4 12-8 30-4 38 4 6 10 2 10-6 0-14-4-26-6-32z" fill="#5DADEC"/>
      <path d="M82 52c-4 12-8 30-4 38 4 6 10 2 10-6 0-14-4-26-6-32z" fill="#5DADEC"/>
    `)
  },
  {
    id: 'stk-salute-respect',
    name: 'Salute Respect',
    category: 'reactions',
    tags: ['salute', 'respect', 'honor', 'f', 'sir', 'yes sir'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="54" fill="#FFCC4D"/>
      <ellipse cx="44" cy="54" rx="5" ry="6" fill="#664500"/>
      <ellipse cx="76" cy="54" rx="5" ry="6" fill="#664500"/>
      <path d="M46 78c8 4 20 4 28 0" stroke="#664500" stroke-width="4" stroke-linecap="round" fill="none"/>
      <!-- Saluting arm & hand over right brow -->
      <path d="M72 26l22 10-8 14-16-10z" fill="#FFAC33"/>
      <path d="M68 28c4-4 14-6 24 2" stroke="#664500" stroke-width="4" stroke-linecap="round" fill="none"/>
    `)
  },
  {
    id: 'stk-eyes-peeking',
    name: 'Peeking Eyes',
    category: 'reactions',
    tags: ['eyes', 'look', 'drama', 'tea', 'peeking', 'watching', 'curious'],
    url: makeSvgDataUri(`
      <ellipse cx="42" cy="60" rx="20" ry="26" fill="#ffffff" stroke="#CCD6DD" stroke-width="3"/>
      <ellipse cx="78" cy="60" rx="20" ry="26" fill="#ffffff" stroke="#CCD6DD" stroke-width="3"/>
      <ellipse cx="38" cy="60" rx="10" ry="14" fill="#292F33"/>
      <ellipse cx="74" cy="60" rx="10" ry="14" fill="#292F33"/>
      <circle cx="36" cy="56" r="4" fill="#ffffff"/>
      <circle cx="72" cy="56" r="4" fill="#ffffff"/>
    `)
  }
];

// 2. Cute Pets & Animals Pack
const ANIMAL_STICKERS: StickerItem[] = [
  {
    id: 'stk-cat-happy',
    name: 'Happy Kitty',
    category: 'animals',
    tags: ['cat', 'kitten', 'kitty', 'cute', 'meow', 'happy', 'paws'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="68" r="42" fill="#FFA726"/>
      <!-- Cat ears -->
      <polygon points="26,44 18,12 48,28" fill="#FFA726"/>
      <polygon points="28,38 24,20 42,30" fill="#FF8A80"/>
      <polygon points="94,44 102,12 72,28" fill="#FFA726"/>
      <polygon points="92,38 96,20 78,30" fill="#FF8A80"/>
      <!-- Eyes & face -->
      <ellipse cx="44" cy="64" rx="4" ry="6" fill="#3E2723"/>
      <ellipse cx="76" cy="64" rx="4" ry="6" fill="#3E2723"/>
      <polygon points="60,72 56,76 64,76" fill="#D81B60"/>
      <path d="M52 79c4 4 8 2 8 0 0 2 4 4 8 0" stroke="#3E2723" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Whiskers -->
      <line x1="20" y1="68" x2="38" y2="72" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="78" x2="38" y2="76" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="68" x2="82" y2="72" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="78" x2="82" y2="76" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>
    `)
  },
  {
    id: 'stk-shiba-doge',
    name: 'Shiba Doge',
    category: 'animals',
    tags: ['dog', 'doge', 'shiba', 'puppy', 'bark', 'cute', 'woof'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="64" r="44" fill="#E67E22"/>
      <!-- Ears -->
      <polygon points="28,40 20,10 50,24" fill="#D35400"/>
      <polygon points="92,40 100,10 70,24" fill="#D35400"/>
      <!-- White cheeks -->
      <ellipse cx="40" cy="74" rx="18" ry="20" fill="#FFF9E6"/>
      <ellipse cx="80" cy="74" rx="18" ry="20" fill="#FFF9E6"/>
      <ellipse cx="44" cy="58" rx="4" ry="5" fill="#2C3E50"/>
      <ellipse cx="76" cy="58" rx="4" ry="5" fill="#2C3E50"/>
      <ellipse cx="60" cy="70" rx="6" ry="4" fill="#2C3E50"/>
      <path d="M54 75c3 4 6 2 6 0 0 2 3 4 6 0" stroke="#2C3E50" stroke-width="2.5" fill="none"/>
      <!-- Tongue -->
      <path d="M58 77h4v6c0 2-2 3-2 3s-2-1-2-3z" fill="#E74C3C"/>
    `)
  },
  {
    id: 'stk-capybara-chill',
    name: 'Chill Capybara',
    category: 'animals',
    tags: ['capybara', 'chill', 'zen', 'calm', 'orange', 'relax', 'bro'],
    url: makeSvgDataUri(`
      <ellipse cx="60" cy="72" rx="42" ry="34" fill="#8D6E63"/>
      <!-- Ears -->
      <circle cx="34" cy="46" r="6" fill="#6D4C41"/>
      <circle cx="86" cy="46" r="6" fill="#6D4C41"/>
      <!-- Snout -->
      <rect x="42" y="60" width="36" height="34" rx="12" fill="#795548"/>
      <ellipse cx="50" cy="62" rx="4" ry="2" fill="#3E2723"/>
      <ellipse cx="70" cy="62" rx="4" ry="2" fill="#3E2723"/>
      <line x1="52" y1="84" x2="68" y2="84" stroke="#3E2723" stroke-width="3" stroke-linecap="round"/>
      <!-- Orange on head -->
      <circle cx="60" cy="36" r="13" fill="#FF9800"/>
      <ellipse cx="60" cy="23" rx="3" ry="5" fill="#4CAF50" transform="rotate(30 60 23)"/>
    `)
  },
  {
    id: 'stk-panda-cheer',
    name: 'Panda Hug',
    category: 'animals',
    tags: ['panda', 'bear', 'cute', 'hug', 'bamboo', 'fluffy'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="68" r="42" fill="#FFFFFF" stroke="#ECEFF1" stroke-width="2"/>
      <!-- Ears -->
      <circle cx="28" cy="34" r="14" fill="#263238"/>
      <circle cx="92" cy="34" r="14" fill="#263238"/>
      <!-- Eye patches -->
      <ellipse cx="44" cy="62" rx="12" ry="16" fill="#263238" transform="rotate(-15 44 62)"/>
      <ellipse cx="76" cy="62" rx="12" ry="16" fill="#263238" transform="rotate(15 76 62)"/>
      <circle cx="44" cy="60" r="4" fill="#FFFFFF"/>
      <circle cx="76" cy="60" r="4" fill="#FFFFFF"/>
      <!-- Nose & mouth -->
      <ellipse cx="60" cy="74" rx="6" ry="4" fill="#263238"/>
      <path d="M54 80c3 3 6 1 6 0 0 1 3 3 6 0" stroke="#263238" stroke-width="2.5" fill="none"/>
    `)
  },
  {
    id: 'stk-bunny-carrot',
    name: 'Bunny & Carrot',
    category: 'animals',
    tags: ['bunny', 'rabbit', 'carrot', 'cute', 'hop', 'sweet'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="74" r="38" fill="#ECEFF1"/>
      <!-- Tall ears -->
      <ellipse cx="44" cy="30" rx="10" ry="24" fill="#ECEFF1"/>
      <ellipse cx="44" cy="30" rx="5" ry="18" fill="#F8BBD0"/>
      <ellipse cx="76" cy="30" rx="10" ry="24" fill="#ECEFF1"/>
      <ellipse cx="76" cy="30" rx="5" ry="18" fill="#F8BBD0"/>
      <!-- Eyes & nose -->
      <circle cx="48" cy="68" r="4" fill="#37474F"/>
      <circle cx="72" cy="68" r="4" fill="#37474F"/>
      <polygon points="60,75 57,78 63,78" fill="#E91E63"/>
      <!-- Cute carrot -->
      <path d="M86 78l16-6c2 4 0 8-4 10l-12-4z" fill="#FF7043"/>
      <ellipse cx="104" cy="72" rx="3" ry="5" fill="#66BB6A" transform="rotate(45 104 72)"/>
    `)
  },
  {
    id: 'stk-otter-heart',
    name: 'Otter with Love',
    category: 'animals',
    tags: ['otter', 'heart', 'cute', 'love', 'water', 'sweet'],
    url: makeSvgDataUri(`
      <ellipse cx="60" cy="68" rx="42" ry="38" fill="#795548"/>
      <!-- Cheeks -->
      <ellipse cx="60" cy="76" rx="28" ry="18" fill="#D7CCC8"/>
      <circle cx="42" cy="62" r="5" fill="#3E2723"/>
      <circle cx="78" cy="62" r="5" fill="#3E2723"/>
      <ellipse cx="60" cy="70" rx="6" ry="4" fill="#3E2723"/>
      <!-- Little heart held -->
      <path d="M60 88c-4-4-10-2-10 4 0 6 10 12 10 12s10-6 10-12c0-6-6-8-10-4z" fill="#E91E63"/>
    `)
  }
];

// 3. Anime & Chibi Expressions
const CHIBI_STICKERS: StickerItem[] = [
  {
    id: 'stk-chibi-sparkle',
    name: 'Chibi Sparkle Yay',
    category: 'chibi',
    tags: ['anime', 'chibi', 'sparkle', 'happy', 'star', 'excited', 'kawaii'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="48" fill="#FFF3E0"/>
      <!-- Hair -->
      <path d="M14 54C14 26 36 14 60 14s46 12 46 40c-6-10-18-12-28-12-12 0-24 6-36 6s-22-6-28-14z" fill="#5D4037"/>
      <!-- Star Eyes -->
      <polygon points="42,50 45,58 53,58 47,63 49,71 42,66 35,71 37,63 31,58 39,58" fill="#FFD54F"/>
      <polygon points="78,50 81,58 89,58 83,63 85,71 78,66 71,71 73,63 67,58 75,58" fill="#FFD54F"/>
      <!-- Open mouth & blush -->
      <path d="M52 82c2 8 14 8 16 0z" fill="#E53935"/>
      <ellipse cx="32" cy="74" rx="7" ry="4" fill="#FF8A80" opacity="0.7"/>
      <ellipse cx="88" cy="74" rx="7" ry="4" fill="#FF8A80" opacity="0.7"/>
    `)
  },
  {
    id: 'stk-chibi-shocked',
    name: 'Chibi Shocked',
    category: 'chibi',
    tags: ['chibi', 'anime', 'shocked', 'sweatdrop', 'omg', 'scared', 'gasp'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="62" r="48" fill="#FFF3E0"/>
      <path d="M14 54C14 26 36 14 60 14s46 12 46 40c-10-8-22-10-34-10s-28 6-38 6-16-4-20-14z" fill="#424242"/>
      <circle cx="42" cy="60" r="9" fill="#212121"/>
      <circle cx="78" cy="60" r="9" fill="#212121"/>
      <circle cx="44" cy="58" r="3" fill="#ffffff"/>
      <circle cx="80" cy="58" r="3" fill="#ffffff"/>
      <ellipse cx="60" cy="84" rx="8" ry="12" fill="#D32F2F"/>
      <!-- Giant blue anime sweatdrop -->
      <path d="M96 34c-6 12-10 18-6 22 4 4 10 2 12-4 2-8-2-12-6-18z" fill="#4FC3F7"/>
    `)
  },
  {
    id: 'stk-chibi-pout',
    name: 'Chibi Angry Pout',
    category: 'chibi',
    tags: ['chibi', 'anime', 'pout', 'angry', 'hmpf', 'cute', 'mad'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="48" fill="#FFF3E0"/>
      <path d="M14 50C14 24 38 14 60 14s46 10 46 36c-12-6-24-8-36-8s-26 4-36 6-12-2-16-8z" fill="#E91E63"/>
      <!-- Angry furrowed brows -->
      <line x1="32" y1="52" x2="48" y2="58" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="88" y1="52" x2="72" y2="58" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Pout mouth -->
      <ellipse cx="60" cy="80" rx="5" ry="4" fill="#FF4081"/>
      <ellipse cx="32" cy="72" rx="7" ry="4" fill="#FF80AB"/>
      <ellipse cx="88" cy="72" rx="7" ry="4" fill="#FF80AB"/>
      <!-- Comic anger vein -->
      <path d="M88 28h12M94 22v12" stroke="#E53935" stroke-width="3" stroke-linecap="round"/>
    `)
  },
  {
    id: 'stk-chibi-sleepy',
    name: 'Chibi Sleeping Zzz',
    category: 'chibi',
    tags: ['chibi', 'sleepy', 'zzz', 'night', 'tired', 'rest', 'bed'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="62" r="48" fill="#FFF3E0"/>
      <path d="M14 52C14 26 36 16 60 16s46 10 46 36c-8-6-20-8-32-8s-28 4-40 6-14-4-20-10z" fill="#3F51B5"/>
      <!-- Sleeping eye lines -->
      <path d="M34 60c4 4 14 4 18 0M68 60c4 4 14 4 18 0" stroke="#333" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <!-- Snot bubble -->
      <circle cx="68" cy="76" r="10" fill="#81D4FA" opacity="0.85"/>
      <circle cx="66" cy="74" r="3" fill="#ffffff"/>
      <text x="88" y="34" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#3F51B5">Z</text>
      <text x="100" y="24" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#3F51B5">z</text>
    `)
  }
];

// 4. Desi & Festive Vibes Pack
const DESI_STICKERS: StickerItem[] = [
  {
    id: 'stk-namaste',
    name: 'Namaste Folded Hands',
    category: 'desi',
    tags: ['namaste', 'pranam', 'folded hands', 'welcome', 'respect', 'indian', 'india', 'peace'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="60" r="54" fill="#FF9933"/>
      <!-- Marigold garland wreath -->
      <circle cx="60" cy="60" r="42" fill="#FFF8E1"/>
      <!-- Hands praying -->
      <path d="M52 38c0-8 6-14 8-14s8 6 8 14v32h-16V38z" fill="#FFCC80"/>
      <path d="M42 46c0-6 4-10 6-10s6 4 6 10v24H42V46z" fill="#FFA726"/>
      <path d="M66 46c0-6 4-10 6-10s6 4 6 10v24h-12V46z" fill="#FFA726"/>
      <!-- Golden bangles -->
      <rect x="42" y="74" width="36" height="8" rx="4" fill="#E65100"/>
      <text x="60" y="104" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#E65100" text-anchor="middle">NAMASTE</text>
    `)
  },
  {
    id: 'stk-chai-lover',
    name: 'Chai is Life',
    category: 'desi',
    tags: ['chai', 'tea', 'kulhad', 'kadak', 'morning', 'break', 'desi'],
    url: makeSvgDataUri(`
      <!-- Kulhad clay cup -->
      <path d="M38 46l8 48h28l8-48z" fill="#BCAAA4"/>
      <ellipse cx="60" cy="46" rx="22" ry="7" fill="#6D4C41"/>
      <ellipse cx="60" cy="47" rx="19" ry="5" fill="#8D6E63"/>
      <!-- Hot steam waves -->
      <path d="M50 36c-4-8 4-12 0-20M60 36c-4-8 4-12 0-20M70 36c-4-8 4-12 0-20" stroke="#FF7043" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Text badge -->
      <rect x="24" y="98" width="72" height="18" rx="9" fill="#D84315"/>
      <text x="60" y="111" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#ffffff" text-anchor="middle">CHAI TIME</text>
    `)
  },
  {
    id: 'stk-jugaad-smart',
    name: 'Jugaad Power',
    category: 'desi',
    tags: ['jugaad', 'idea', 'smart', 'hack', 'lightbulb', 'solution', 'desi'],
    url: makeSvgDataUri(`
      <circle cx="60" cy="52" r="30" fill="#FFEB3B" filter="drop-shadow(0 0 10px #FFD54F)"/>
      <rect x="52" y="80" width="16" height="12" rx="3" fill="#90A4AE"/>
      <!-- Filament smile -->
      <path d="M48 50c4 6 20 6 24 0" stroke="#F57F17" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="48" cy="42" r="3" fill="#F57F17"/>
      <circle cx="72" cy="42" r="3" fill="#F57F17"/>
      <!-- Text pill -->
      <rect x="22" y="96" width="76" height="20" rx="10" fill="#1B5E20"/>
      <text x="60" y="110" font-family="Arial, sans-serif" font-weight="900" font-size="12" fill="#ffffff" text-anchor="middle">JUGAAD</text>
    `)
  },
  {
    id: 'stk-auto-rickshaw',
    name: 'Tuk Tuk Desi Swag',
    category: 'desi',
    tags: ['auto', 'rickshaw', 'tuk tuk', 'horn', 'traffic', 'swag', 'mumbai', 'delhi'],
    url: makeSvgDataUri(`
      <!-- Auto Rickshaw body -->
      <path d="M22 68l12-32h52l12 18v14h-8a12 12 0 0 0-24 0H52a12 12 0 0 0-24 0z" fill="#FBC02D"/>
      <!-- Black & green hood -->
      <path d="M32 36l-8 32h72l-4-32z" fill="#2E7D32"/>
      <circle cx="40" cy="80" r="10" fill="#212121"/>
      <circle cx="82" cy="80" r="10" fill="#212121"/>
      <circle cx="40" cy="80" r="4" fill="#ECEFF1"/>
      <circle cx="82" cy="80" r="4" fill="#ECEFF1"/>
      <!-- Headlight -->
      <circle cx="18" cy="62" r="5" fill="#FFF59D"/>
      <rect x="28" y="96" width="64" height="18" rx="9" fill="#000000"/>
      <text x="60" y="109" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#FFEB3B" text-anchor="middle">HORN OK</text>
    `)
  },
  {
    id: 'stk-diya-festive',
    name: 'Diya Lights',
    category: 'desi',
    tags: ['diya', 'diwali', 'festival', 'lights', 'celebration', 'puja', 'auspicious'],
    url: makeSvgDataUri(`
      <!-- Terracotta base -->
      <ellipse cx="60" cy="78" rx="42" ry="18" fill="#D84315"/>
      <ellipse cx="60" cy="74" rx="36" ry="12" fill="#E64A19"/>
      <!-- Flame -->
      <path d="M60 22c8 14 14 26 14 36 0 10-6 16-14 16s-14-6-14-16c0-10 6-22 14-36z" fill="#FF9800"/>
      <path d="M60 38c4 8 8 16 8 22 0 6-4 10-8 10s-8-4-8-10c0-6 4-14 8-22z" fill="#FFEE58"/>
    `)
  }
];

// All Built-in Stickers
export const ALL_STICKERS: StickerItem[] = [
  ...REACTIONS_STICKERS,
  ...ANIMAL_STICKERS,
  ...CHIBI_STICKERS,
  ...DESI_STICKERS,
];

// Pack definitions
export const STICKER_PACKS: StickerPack[] = [
  {
    id: 'reactions',
    name: 'Reactions & Memes',
    icon: '😂',
    stickers: REACTIONS_STICKERS
  },
  {
    id: 'animals',
    name: 'Cute Pets',
    icon: '🐱',
    stickers: ANIMAL_STICKERS
  },
  {
    id: 'chibi',
    name: 'Anime Chibi',
    icon: '🌸',
    stickers: CHIBI_STICKERS
  },
  {
    id: 'desi',
    name: 'Desi Vibes',
    icon: '🪔',
    stickers: DESI_STICKERS
  }
];

// -------------------------------------------------------------
// Storage & State helpers
// -------------------------------------------------------------

export function getCustomStickers(): StickerItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_CUSTOM_STICKERS);
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  } catch {
    return [];
  }
}

export function saveCustomSticker(sticker: StickerItem): StickerItem[] {
  try {
    const current = getCustomStickers();
    const updated = [sticker, ...current.filter((s) => s.id !== sticker.id)];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_CUSTOM_STICKERS, JSON.stringify(updated));
    }
    return updated;
  } catch (e) {
    console.error('Failed to save custom sticker', e);
    return getCustomStickers();
  }
}

export function deleteCustomSticker(stickerId: string): StickerItem[] {
  try {
    const current = getCustomStickers();
    const updated = current.filter((s) => s.id !== stickerId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_CUSTOM_STICKERS, JSON.stringify(updated));
    }
    return updated;
  } catch {
    return getCustomStickers();
  }
}

export function getStarredStickerIds(): string[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_STARRED_STICKERS);
      return raw ? JSON.parse(raw) : ['stk-laugh-cry', 'stk-fire-lit', 'stk-cat-happy', 'stk-namaste'];
    }
    return ['stk-laugh-cry', 'stk-fire-lit', 'stk-cat-happy', 'stk-namaste'];
  } catch {
    return ['stk-laugh-cry', 'stk-fire-lit', 'stk-cat-happy', 'stk-namaste'];
  }
}

export function toggleStarSticker(stickerId: string): string[] {
  try {
    const current = getStarredStickerIds();
    const exists = current.includes(stickerId);
    const updated = exists ? current.filter((id) => id !== stickerId) : [stickerId, ...current];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_STARRED_STICKERS, JSON.stringify(updated));
    }
    return updated;
  } catch {
    return getStarredStickerIds();
  }
}

export function getRecentStickerIds(): string[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_RECENT_STICKERS);
      return raw ? JSON.parse(raw) : ['stk-laugh-cry', 'stk-cool-sunglasses', 'stk-heart-eyes', 'stk-namaste'];
    }
    return ['stk-laugh-cry', 'stk-cool-sunglasses', 'stk-heart-eyes', 'stk-namaste'];
  } catch {
    return ['stk-laugh-cry', 'stk-cool-sunglasses', 'stk-heart-eyes', 'stk-namaste'];
  }
}

export function recordRecentSticker(stickerId: string): void {
  try {
    const current = getRecentStickerIds();
    const updated = [stickerId, ...current.filter((id) => id !== stickerId)].slice(0, 30);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_RECENT_STICKERS, JSON.stringify(updated));
    }
  } catch {
    // Ignore quota issues
  }
}

/**
 * Filter stickers by query keyword
 */
export function searchStickers(query: string, allStickers: StickerItem[]): StickerItem[] {
  if (!query || !query.trim()) return allStickers;
  const q = query.trim().toLowerCase();

  return allStickers.filter((item) => {
    if (item.name.toLowerCase().includes(q)) return true;
    return item.tags.some((tag) => tag.toLowerCase().includes(q));
  });
}
