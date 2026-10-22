import React, { useState } from 'react';
import { Globe, Search, Check } from 'lucide-react';
import { AppSettings, settingsService } from '../../services/settings';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../../utils/i18n';

interface AppLanguageViewProps {
  settings: AppSettings;
}

export const AppLanguageView: React.FC<AppLanguageViewProps> = ({ settings }) => {
  const [search, setSearch] = useState('');

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectLanguage = (code: string) => {
    settingsService.update({ language: code });
  };

  return (
    <div className="settings-subview">
      {/* Search box */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div className="search-input-wrapper">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-section" style={{ marginTop: '4px' }}>
        <div className="settings-section-title">
          <span>Choose language</span>
        </div>

        <div className="settings-radio-group">
          {filteredLanguages.map((lang) => {
            const isSelected = settings.language === lang.code;
            return (
              <div
                key={lang.code}
                className="settings-radio-row"
                onClick={() => handleSelectLanguage(lang.code)}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {lang.nativeName}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {lang.name}
                  </span>
                </div>
                <div className={`settings-radio-circle ${isSelected ? 'selected' : ''}`}>
                  {isSelected && <div className="settings-radio-inner" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
