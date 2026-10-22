import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Clock,
  Smile,
  Hand,
  Dog,
  Utensils,
  Trophy,
  Car,
  Lightbulb,
  Heart,
  Flag
} from 'lucide-react';
import { EMOJI_CATEGORIES, EmojiItem } from './emojiData';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
  className?: string;
  style?: React.CSSProperties;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  recent: <Clock size={18} />,
  smileys: <Smile size={18} />,
  people: <Hand size={18} />,
  animals: <Dog size={18} />,
  food: <Utensils size={18} />,
  activities: <Trophy size={18} />,
  travel: <Car size={18} />,
  objects: <Lightbulb size={18} />,
  symbols: <Heart size={18} />,
  flags: <Flag size={18} />
};

const CATEGORY_NAMES: Record<string, string> = {
  recent: 'Recent',
  smileys: 'Smileys',
  people: 'People',
  animals: 'Animals',
  food: 'Food',
  activities: 'Activities',
  travel: 'Travel',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags'
};

const RECENT_STORAGE_KEY = 'chat_recent_emojis';
const MAX_RECENT = 32;

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelectEmoji,
  onClose,
  className = '',
  style
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['😀', '😂', '😍', '👍', '❤️', '🔥', '🎉', '🙏'];
    } catch {
      return ['😀', '😂', '😍', '👍', '❤️', '🔥', '🎉', '🙏'];
    }
  });

  const pickerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Handle emoji click
  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);

    // Save to recents
    setRecentEmojis((prev) => {
      const updated = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore quota errors
      }
      return updated;
    });
  };

  // Switch tab and reset scroll position
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery('');
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Filter emojis based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.trim().toLowerCase();

    const matches: EmojiItem[] = [];
    const seen = new Set<string>();

    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (seen.has(item.emoji)) continue;
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesKeyword = item.keywords.some((k) => k.toLowerCase().includes(query));

        if (matchesName || matchesKeyword) {
          seen.add(item.emoji);
          matches.push(item);
        }
      }
    }
    return matches;
  }, [searchQuery]);

  // Current active category
  const currentCategory = useMemo(() => {
    return EMOJI_CATEGORIES.find((cat) => cat.id === activeTab) || EMOJI_CATEGORIES[0];
  }, [activeTab]);

  return (
    <div
      ref={pickerRef}
      className={`whatsapp-emoji-picker ${className}`}
      style={style}
      role="dialog"
      aria-label="Emoji Picker"
    >
      {/* Header & Search */}
      <div className="emoji-picker-header">
        <div className="emoji-search-box">
          <Search size={16} className="emoji-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="emoji-search-input"
            placeholder="Search all emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="emoji-search-clear"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          className="emoji-picker-close"
          onClick={onClose}
          title="Close emojis (Esc)"
          aria-label="Close emojis"
        >
          <X size={18} />
        </button>
      </div>

      {/* Category Tabs Bar - Top Navigation */}
      <div className="emoji-category-tabs" role="tablist">
        {/* Recent Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'recent' && !searchQuery}
          className={`emoji-tab-btn ${activeTab === 'recent' && !searchQuery ? 'active' : ''}`}
          onClick={() => handleTabChange('recent')}
          title="Recently Used"
        >
          {CATEGORY_ICONS.recent}
        </button>

        {/* Standard Category Tabs */}
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeTab === cat.id && !searchQuery}
            className={`emoji-tab-btn ${activeTab === cat.id && !searchQuery ? 'active' : ''}`}
            onClick={() => handleTabChange(cat.id)}
            title={`${cat.name} (${cat.emojis.length})`}
          >
            {CATEGORY_ICONS[cat.id] || <Smile size={18} />}
          </button>
        ))}
      </div>

      {/* Main Emoji Area - Displays ONLY the Active Tab's Emojis */}
      <div ref={scrollContainerRef} className="emoji-picker-scroll">
        {searchResults !== null ? (
          // Search Results Mode
          <div className="emoji-category-section">
            <div className="emoji-category-title">
              SEARCH RESULTS ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="emoji-no-results">
                No emojis found matching "{searchQuery}"
              </div>
            ) : (
              <div className="emoji-grid">
                {searchResults.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    className="emoji-item-btn"
                    onClick={() => handleEmojiClick(item.emoji)}
                    title={item.name}
                    aria-label={item.name}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'recent' ? (
          // Separate Tab: Recent Emojis ONLY
          <div className="emoji-category-section">
            <div className="emoji-category-title">
              RECENTLY USED ({recentEmojis.length})
            </div>
            {recentEmojis.length === 0 ? (
              <div className="emoji-no-results">
                No recently used emojis yet. Click on any emoji to add it here!
              </div>
            ) : (
              <div className="emoji-grid">
                {recentEmojis.map((emoji, idx) => (
                  <button
                    key={`recent-${emoji}-${idx}`}
                    type="button"
                    className="emoji-item-btn"
                    onClick={() => handleEmojiClick(emoji)}
                    title={`Recent: ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Separate Tab: Active Category Emojis ONLY
          <div className="emoji-category-section">
            <div className="emoji-category-title">
              {currentCategory.name.toUpperCase()} ({currentCategory.emojis.length})
            </div>
            <div className="emoji-grid">
              {currentCategory.emojis.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  className="emoji-item-btn"
                  onClick={() => handleEmojiClick(item.emoji)}
                  title={item.name}
                  aria-label={item.name}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status / Tab Label Indicator */}
      <div className="emoji-picker-footer">
        <span className="emoji-footer-label">
          {searchQuery
            ? `Search: "${searchQuery}"`
            : activeTab === 'recent'
            ? '🕒 Recently Used'
            : `${currentCategory.name} (${currentCategory.emojis.length})`}
        </span>
      </div>
    </div>
  );
};
