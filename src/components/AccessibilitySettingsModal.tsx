import React from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Type, 
  Contrast, 
  Volume2, 
  Cloud, 
  ShieldCheck, 
  Check, 
  RotateCcw,
  Sparkles,
  Eye
} from 'lucide-react';
import { AccessibilitySettings } from '../types';

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void;
  onOpenCloudVault: () => void;
}

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenCloudVault,
}) => {
  if (!isOpen) return null;

  const handleResetDefaults = () => {
    onUpdateSettings({
      textSize: 'normal',
      highContrast: false,
      dyslexicFont: false,
      screenReaderOptimized: false,
      autoSpeak: false,
      speechRate: 1.0,
      speechPitch: 1.0,
      preferredLanguage: 'en-US',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-indigo-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Accessibility & App Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize font sizes, contrast, text-to-speech audio, and cloud synchronization.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Visual Accessibility Options */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 font-heading">
            <Eye className="w-4 h-4" /> Visual Ergonomics & Legibility
          </h4>

          {/* Text Size */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Text Scale / Font Size</span>
              <span className="capitalize font-mono text-indigo-600 dark:text-indigo-400">{settings.textSize}</span>
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ textSize: size })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                    settings.textSize === size
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast & Dyslexic Font Toggles */}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/40 transition-colors">
              <div>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">High Contrast Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Deep blacks & vivid yellow accents</span>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/40 transition-colors">
              <div>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Dyslexic Legibility Font</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Weighted letterforms for easier reading</span>
              </div>
              <input
                type="checkbox"
                checked={settings.dyslexicFont}
                onChange={(e) => onUpdateSettings({ dyslexicFont: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 2. Text-to-Speech & Audio Controls */}
        <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 font-heading">
            <Volume2 className="w-4 h-4" /> Text-to-Speech & Voice Playback
          </h4>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Speech Rate / Speed</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{settings.speechRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.5x (Slow)</span>
              <span>1.0x (Standard)</span>
              <span>1.5x (Fast)</span>
            </div>
          </div>

          <label className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/40 transition-colors">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Auto-Speak Translations</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Automatically articulate recognized phrases via Web Speech API</span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>

        {/* 3. Cloud Synchronization & Persistence */}
        <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 font-heading">
            <Cloud className="w-4 h-4" /> Cloud Storage & Firebase State
          </h4>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white block font-heading">
                Cloud Firestore & Saved Phrases Vault
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Synchronize custom sign sequences, emergency phrases, and study decks securely.
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenCloudVault();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm transition-colors"
            >
              Open Vault
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
