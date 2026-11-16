import React from 'react';
import { SlidersHorizontal, Volume2, Cloud, RotateCcw, Eye } from 'lucide-react';
import { AccessibilitySettings } from '../types';
import { Button, Modal, useToast } from './ui';

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void;
  onOpenCloudVault: () => void;
}

interface SettingSwitchRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SettingSwitchRow: React.FC<SettingSwitchRowProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
}) => (
  <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#172438]/75 border border-slate-200 dark:border-[#253448] flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-[#374c68] transition-colors">
    <label htmlFor={id} className="min-w-0 cursor-pointer">
      <span className="font-semibold text-xs text-slate-900 dark:text-[#F4F7FB] block font-ethiopic">
        {label}
      </span>
      <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0] block leading-snug font-ethiopic">
        {description}
      </span>
    </label>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
        checked
          ? 'bg-[#0E7490] dark:bg-[#43D9E9] border-transparent'
          : 'bg-slate-200 dark:bg-[#0D1726] border-slate-300 dark:border-[#253448]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-[#080D18] shadow-xs transition-transform duration-150 motion-reduce:transition-none ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        } ${!checked ? 'dark:bg-[#A0AEC0]' : ''}`}
      />
    </button>
  </div>
);

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenCloudVault,
}) => {
  const { showToast } = useToast();

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
    showToast('Accessibility settings restored to defaults', 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accessibility & Preferences"
      description="Personalize font scale, contrast, audio feedback, and 3D performance."
      icon={<SlidersHorizontal className="w-5 h-5" />}
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Defaults
          </Button>
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 1. Visual Accessibility Options */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-2">
            <Eye className="w-4 h-4" aria-hidden="true" /> Visual Ergonomics &amp; Legibility
          </h4>

          <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#172438]/75 border border-slate-200 dark:border-[#253448] space-y-2">
            <div className="text-xs font-semibold text-slate-800 dark:text-[#F4F7FB] flex items-center justify-between">
              <span>Text Scale / Font Size</span>
              <span className="capitalize font-mono text-[#0E7490] dark:text-[#43D9E9]">{settings.textSize}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1" role="group" aria-label="Text size scale">
              {(['normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onUpdateSettings({ textSize: size })}
                  aria-pressed={settings.textSize === size}
                  className={`h-10 px-3 rounded-[8px] text-xs font-semibold capitalize border transition-[colors,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                    settings.textSize === size
                      ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] border-transparent'
                      : 'bg-white dark:bg-[#101C2C] border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <SettingSwitchRow
              id="switch-high-contrast"
              label="High Contrast Mode"
              description="Vivid borders & stronger contrast"
              checked={settings.highContrast}
              onChange={(checked) => onUpdateSettings({ highContrast: checked })}
            />
            <SettingSwitchRow
              id="switch-dyslexic-font"
              label="Dyslexic Legibility Font"
              description="Monospaced letter spacing"
              checked={settings.dyslexicFont}
              onChange={(checked) => onUpdateSettings({ dyslexicFont: checked })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <SettingSwitchRow
              id="switch-disable-3d"
              label="Disable 3D Motion (Static 2D)"
              description="Reduce motion & save battery"
              checked={!!settings.disable3D}
              onChange={(checked) => onUpdateSettings({ disable3D: checked })}
            />
            <SettingSwitchRow
              id="switch-voice-feedback"
              label="Voice Spoken Feedback"
              description="Audibly speak confirmations"
              checked={settings.voiceFeedback !== false}
              onChange={(checked) => onUpdateSettings({ voiceFeedback: checked })}
            />
          </div>
        </div>

        {/* 2. Text-to-Speech & Audio Controls */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#253448]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-2">
            <Volume2 className="w-4 h-4" aria-hidden="true" /> Text-to-Speech Playback
          </h4>

          <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#172438]/75 border border-slate-200 dark:border-[#253448] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="speech-rate-slider" className="font-semibold text-slate-900 dark:text-[#F4F7FB]">
                Speech Rate
              </label>
              <span className="font-mono tabular-nums text-[#0E7490] dark:text-[#43D9E9]">
                {settings.speechRate.toFixed(2)}x
              </span>
            </div>
            <input
              id="speech-rate-slider"
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-[#0E7490] dark:accent-[#43D9E9] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-[#A0AEC0]">
              <span>0.5x (Slow)</span>
              <span>1.0x (Standard)</span>
              <span>1.5x (Fast)</span>
            </div>
          </div>

          <SettingSwitchRow
            id="switch-auto-speak"
            label="Auto-Speak Translations"
            description="Automatically articulate recognized phrases via speech synthesis"
            checked={settings.autoSpeak}
            onChange={(checked) => onUpdateSettings({ autoSpeak: checked })}
          />
        </div>

        {/* 3. Cloud Storage Vault */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#253448]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-2">
            <Cloud className="w-4 h-4" aria-hidden="true" /> Cloud Storage
          </h4>

          <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#172438]/75 border border-slate-200 dark:border-[#253448] flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="font-semibold text-xs text-slate-900 dark:text-[#F4F7FB] block">
                Cloud Firestore Saved Phrases Vault
              </span>
              <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                Synchronize custom sign sequences and emergency phrases securely.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenCloudVault();
              }}
            >
              Open Vault
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
