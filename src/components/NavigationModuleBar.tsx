import React from 'react';
import { 
  Sparkles, 
  Languages, 
  Captions, 
  FileText, 
  Hand, 
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { ActiveModule } from '../types';

interface NavigationModuleBarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
}

export const NavigationModuleBar: React.FC<NavigationModuleBarProps> = ({
  activeModule,
  onSelectModule,
}) => {
  const modules: {
    id: ActiveModule;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badge?: string;
  }[] = [
    {
      id: 'studio',
      label: 'Sign Studio & 3D Hands',
      sublabel: 'Two-Way Camera & Model',
      icon: Hand,
      accentColor: 'emerald',
      badge: 'Core',
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      sublabel: 'Simplify & Suggest Replies',
      icon: Bot,
      accentColor: 'amber',
      badge: 'Gemini 3.8',
    },
    {
      id: 'translate',
      label: 'Universal Translate',
      sublabel: 'Amharic & Multilingual',
      icon: Languages,
      accentColor: 'sky',
    },
    {
      id: 'captions',
      label: 'Live Captions',
      sublabel: 'Speech-to-Text Transcribe',
      icon: Captions,
      accentColor: 'purple',
      badge: 'Gemini 3.5',
    },
    {
      id: 'documents',
      label: 'Document OCR',
      sublabel: 'Extract & Plain Language',
      icon: FileText,
      accentColor: 'rose',
    },
    {
      id: 'settings',
      label: 'Accessibility',
      sublabel: 'Dyslexic, Contrast & Audio',
      icon: SlidersHorizontal,
      accentColor: 'indigo',
    },
  ];

  return (
    <div className="w-full my-6">
      {/* Container with backdrop blur and subtle border */}
      <div className="p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;

            return (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer whitespace-nowrap text-left shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white dark:from-emerald-950 dark:to-slate-900 dark:text-emerald-300 dark:border dark:border-emerald-500/40 shadow-md scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 dark:bg-emerald-500 dark:text-slate-950 font-bold'
                      : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold font-heading">
                      {m.label}
                    </span>
                    {m.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {m.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
