import {Check, Globe, Moon, RotateCcw, Sun, X} from 'lucide-react';
import {
  ACCENT_OPTIONS,
  LANGUAGE_OPTIONS,
  type AccentColor,
  type Language,
  type LocalizedContent,
  type ThemeMode,
} from '../data/nexplayData';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  accent: AccentColor;
  onAccentChange: (accent: AccentColor) => void;
  onReset: () => void;
  copy: LocalizedContent['settings'];
}

export function SettingsModal({
  open,
  onClose,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  accent,
  onAccentChange,
  onReset,
  copy,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11161E] text-slate-900 dark:text-slate-100 p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
          <div>
            <h2
              id="settings-modal-title"
              className="font-display text-xl font-bold text-slate-900 dark:text-white"
            >
              {copy.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="rounded-lg p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Theme Mode */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
              {copy.themeLabel}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] ${
                  theme === 'dark'
                    ? 'border-[var(--accent-main)] bg-[var(--accent-soft)] text-slate-900 dark:text-white font-semibold'
                    : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Moon className="w-4 h-4" aria-hidden="true" />
                {copy.themeDark}
              </button>

              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] ${
                  theme === 'light'
                    ? 'border-[var(--accent-main)] bg-[var(--accent-soft)] text-slate-900 dark:text-white font-semibold'
                    : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
                {copy.themeLight}
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
              {copy.accentLabel}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ACCENT_OPTIONS.map((option) => {
                const isSelected = accent === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onAccentChange(option.id)}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] ${
                      isSelected
                        ? 'border-[var(--accent-main)] bg-[var(--accent-soft)] text-slate-900 dark:text-white font-semibold'
                        : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-3.5 h-3.5 rounded-sm shrink-0"
                        style={{backgroundColor: option.swatch}}
                        aria-hidden="true"
                      />
                      <span className="truncate">{option.labels[language]}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              {copy.languageLabel}
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {LANGUAGE_OPTIONS.map((option) => {
                const isSelected = language === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onLanguageChange(option.id)}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] ${
                      isSelected
                        ? 'border-[var(--accent-main)] bg-[var(--accent-soft)] text-slate-900 dark:text-white font-semibold'
                        : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{option.native}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-2"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            {copy.resetDefaults}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] text-[var(--accent-on)] px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
          >
            {copy.done}
          </button>
        </div>

        <p className="mt-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          by maxiLillo
        </p>
      </div>
    </div>
  );
}
