import React from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Volume2, 
  Cloud, 
  RotateCcw,
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
      disable3D: false,
      voiceNavEnabled: true,
      voiceFeedback: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[20px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                Accessibility & Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8493A8]">
                Personalize font scale, contrast, audio feedback, and 3D animation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] bg-slate-100 hover:bg-slate-200 dark:bg-[#19263A] dark:hover:bg-[#1E2E44] text-slate-500 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors cursor-pointer flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Visual Accessibility Options */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE] flex items-center gap-2">
            <Eye className="w-4 h-4" /> Visual Ergonomics & Legibility
          </h4>

          {/* Text Size */}
          <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
            <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] flex items-center justify-between">
              <span>Text Scale / Font Size</span>
              <span className="capitalize font-mono text-[#22D3EE] text-xs">{settings.textSize}</span>
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ textSize: size })}
                  className={`h-9 px-3 rounded-[8px] text-xs font-medium capitalize border transition-colors cursor-pointer ${
                    settings.textSize === size
                      ? 'bg-[#22D3EE] text-[#080D18] border-[#22D3EE] font-semibold'
                      : 'bg-white dark:bg-[#0D1422] border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-slate-700 dark:text-[#B6C2D2]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast & Dyslexic Font Toggles */}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#22D3EE]/40 transition-colors">
              <div>
                <span className="font-semibold text-xs text-slate-800 dark:text-[#F8FAFC] block">High Contrast Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-[#8493A8]">High-contrast borders & vivid accents</span>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
                className="w-4 h-4 rounded text-[#22D3EE] accent-[#22D3EE] cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#22D3EE]/40 transition-colors">
              <div>
                <span className="font-semibold text-xs text-slate-800 dark:text-[#F8FAFC] block">Dyslexic Legibility Font</span>
                <span className="text-[11px] text-slate-500 dark:text-[#8493A8]">Weighted letterforms for easier reading</span>
              </div>
              <input
                type="checkbox"
                checked={settings.dyslexicFont}
                onChange={(e) => onUpdateSettings({ dyslexicFont: e.target.checked })}
                className="w-4 h-4 rounded text-[#22D3EE] accent-[#22D3EE] cursor-pointer"
              />
            </label>
          </div>

          {/* 3D Visualizer & Voice Options */}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#22D3EE]/40 transition-colors">
              <div>
                <span className="font-semibold text-xs text-slate-800 dark:text-[#F8FAFC] block">Disable 3D Orb (Static 2D)</span>
                <span className="text-[11px] text-slate-500 dark:text-[#8493A8]">Reduce motion and save battery</span>
              </div>
              <input
                type="checkbox"
                checked={!!settings.disable3D}
                onChange={(e) => onUpdateSettings({ disable3D: e.target.checked })}
                className="w-4 h-4 rounded text-[#22D3EE] accent-[#22D3EE] cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#22D3EE]/40 transition-colors">
              <div>
                <span className="font-semibold text-xs text-slate-800 dark:text-[#F8FAFC] block">Voice Spoken Feedback</span>
                <span className="text-[11px] text-slate-500 dark:text-[#8493A8]">Audibly speak confirmations & updates</span>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceFeedback !== false}
                onChange={(e) => onUpdateSettings({ voiceFeedback: e.target.checked })}
                className="w-4 h-4 rounded text-[#22D3EE] accent-[#22D3EE] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 2. Text-to-Speech & Audio Controls */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE] flex items-center gap-2">
            <Volume2 className="w-4 h-4" /> Text-to-Speech Playback
          </h4>

          <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">Speech Rate</span>
              <span className="font-mono text-[#22D3EE] text-xs">{settings.speechRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-[#22D3EE] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#8493A8]">
              <span>0.5x (Slow)</span>
              <span>1.0x (Standard)</span>
              <span>1.5x (Fast)</span>
            </div>
          </div>

          <label className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#22D3EE]/40 transition-colors">
            <div>
              <span className="font-semibold text-xs text-slate-800 dark:text-[#F8FAFC] block">Auto-Speak Translations</span>
              <span className="text-[11px] text-slate-500 dark:text-[#8493A8]">Automatically articulate recognized phrases via speech synthesis</span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
              className="w-4 h-4 rounded text-[#22D3EE] accent-[#22D3EE] cursor-pointer"
            />
          </label>
        </div>

        {/* 3. Cloud Storage Vault */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE] flex items-center gap-2">
            <Cloud className="w-4 h-4" /> Cloud Storage
          </h4>

          <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-xs text-slate-900 dark:text-[#F8FAFC] block">
                Cloud Firestore Saved Phrases Vault
              </span>
              <span className="text-[11px] text-slate-500 dark:text-[#8493A8]">
                Synchronize custom sign sequences and emergency phrases securely.
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenCloudVault();
              }}
              className="h-9 px-4 rounded-[8px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-[#22D3EE] font-semibold text-xs shrink-0 cursor-pointer transition-colors border border-slate-200 dark:border-[rgba(148,163,184,0.15)]"
            >
              Open Vault
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
          <button
            onClick={handleResetDefaults}
            className="h-9 px-3 rounded-[8px] text-xs font-medium text-slate-500 dark:text-[#8493A8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="h-10 px-6 rounded-[10px] bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
