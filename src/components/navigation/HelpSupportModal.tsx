import React from 'react';
import {
  BookOpen,
  FlaskConical,
  HelpCircle,
  Keyboard,
  Mic,
  ShieldCheck,
} from 'lucide-react';
import { AppLanguage } from '../../config/navigation';
import { Button, Modal } from '../ui';

interface HelpSupportModalProps {
  isOpen: boolean;
  language: AppLanguage;
  onClose: () => void;
  onOpenEvaluationLab: () => void;
  onOpenArchitecture: () => void;
  onGoToOverview: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  language,
  onClose,
  onOpenEvaluationLab,
  onOpenArchitecture,
  onGoToOverview,
}) => {
  const isAm = language === 'am';

  const shortcuts = isAm
    ? [
        { keys: 'Alt + 1..9', label: 'ወደ ስራ ቦታዎች በቀጥታ ይሂዱ' },
        { keys: 'Ctrl + B', label: 'የጎን ምናሌን ይክፈቱ ወይም ይዘጉ' },
        { keys: 'Alt + V', label: 'የድምፅ አሰሳን ያብሩ / ያጥፉ' },
        { keys: 'Ctrl + K', label: 'የተቀመጡ ምልክቶች ማከማቻ ክፈት' },
        { keys: 'Ctrl + L', label: 'የግምገማ ላብራቶሪ ክፈት' },
        { keys: 'Ctrl + ,', label: 'የተደራሽነት ቅንብሮች ክፈት' },
        { keys: 'Ctrl + M', label: 'ጨለማ / ብሩህ ገጽታ ቀይር' },
        { keys: 'Esc', label: 'ንግግርን አቁም ወይም መስኮት ዝጋ' },
      ]
    : [
        { keys: 'Alt + 1..9', label: 'Switch workspace routes directly' },
        { keys: 'Ctrl + B', label: 'Collapse or expand desktop sidebar' },
        { keys: 'Alt + V', label: 'Toggle hands-free Voice Navigation' },
        { keys: 'Ctrl + K', label: 'Open Cloud Storage Vault' },
        { keys: 'Ctrl + L', label: 'Open Evaluation & Testing Lab' },
        { keys: 'Ctrl + ,', label: 'Open Accessibility Settings' },
        { keys: 'Ctrl + M', label: 'Toggle Dark / Light theme' },
        { keys: 'Esc', label: 'Stop active speech or close modal' },
      ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAm ? 'እርዳታ፣ አቋራጮች እና መመሪያዎች' : 'Help, Shortcuts & System Resources'}
      description={
        isAm
          ? 'የEjjiLink AI የአጠቃቀም መመሪያ እና የግላዊነት መረጃ'
          : 'Navigation shortcuts, diagnostic labs, and camera guidance'
      }
      icon={<HelpCircle className="w-5 h-5" />}
      footer={
        <div className="w-full flex items-center justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            {isAm ? 'ዝጋ' : 'Done'}
          </Button>
        </div>
      }
    >
      {/* Quick Resource Links */}
      <div className="grid sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenEvaluationLab();
          }}
          className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#172438] hover:border-[#0E7490] dark:hover:border-[#43D9E9] border border-slate-200 dark:border-[#253448] text-left transition-[border-color,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer"
        >
          <FlaskConical className="w-5 h-5 text-[#0E7490] dark:text-[#43D9E9] mb-2" aria-hidden="true" />
          <div className="text-sm font-semibold font-ethiopic">
            {isAm ? 'የግምገማ ላብራቶሪ' : 'Evaluation Lab'}
          </div>
          <p className="text-xs text-slate-600 dark:text-[#A0AEC0] mt-1 font-ethiopic">
            {isAm
              ? 'የማወቂያ ትክክለኛነትን እና ፍጥነትን ይመልከቱ'
              : 'Inspect recognition accuracy, latency & confusion matrix'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenArchitecture();
          }}
          className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#172438] hover:border-[#4F46E5] dark:hover:border-[#8585FF] border border-slate-200 dark:border-[#253448] text-left transition-[border-color,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5 text-[#4F46E5] dark:text-[#8585FF] mb-2" aria-hidden="true" />
          <div className="text-sm font-semibold font-ethiopic">
            {isAm ? 'ግላዊነት እና ስርዓት' : 'Privacy & Architecture'}
          </div>
          <p className="text-xs text-slate-600 dark:text-[#A0AEC0] mt-1 font-ethiopic">
            {isAm
              ? 'በመሳሪያ ላይ የሚሰራ MediaPipe እና የውሂብ ጥበቃ'
              : 'On-device MediaPipe inference & data security specs'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onGoToOverview();
          }}
          className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#172438] hover:border-[#0E7490] dark:hover:border-[#43D9E9] border border-slate-200 dark:border-[#253448] text-left transition-[border-color,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer"
        >
          <BookOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400 mb-2" aria-hidden="true" />
          <div className="text-sm font-semibold font-ethiopic">
            {isAm ? 'የካሜራ አጠቃቀም መመሪያ' : 'Camera Setup Guide'}
          </div>
          <p className="text-xs text-slate-600 dark:text-[#A0AEC0] mt-1 font-ethiopic">
            {isAm
              ? 'የእጅ አቀማመጥ እና የብርሃን ምክሮች'
              : 'Framing, lighting & precision sign capture tips'}
          </p>
        </button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="rounded-[14px] bg-slate-50 dark:bg-[#0D1726] border border-slate-200 dark:border-[#253448] p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#A0AEC0] font-ethiopic">
          <Keyboard className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
          <span>{isAm ? 'የቁልፍ ሰሌዳ አቋራጮች' : 'Keyboard Shortcuts'}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {shortcuts.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448]"
            >
              <span className="text-slate-700 dark:text-[#A0AEC0] font-ethiopic">{s.label}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] font-mono text-[11px] text-[#0E7490] dark:text-[#43D9E9] shrink-0">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Commands Note */}
      <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-cyan-50/70 dark:bg-[#172438] border border-cyan-200/70 dark:border-[#253448] text-xs">
        <Mic className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-slate-700 dark:text-[#A0AEC0] font-ethiopic">
          <strong className="text-slate-900 dark:text-[#F4F7FB]">
            {isAm ? 'የድምፅ መቆጣጠሪያ፦' : 'Voice Control:'}
          </strong>{' '}
          {isAm ? (
            <>
              <kbd className="font-mono text-[#0E7490] dark:text-[#43D9E9]">Alt+V</kbd> ይጫኑ ወይም ከታች ቀኝ ያለውን የድምፅ መቆጣጠሪያ በመጠቀም{' '}
              <span className="font-mono">“open live recognition”</span>፣ <span className="font-mono">“open 3D hand studio”</span>፣{' '}
              <span className="font-mono">“open vocabulary”</span> ወይም <span className="font-mono">“translate”</span> ይበሉ።
            </>
          ) : (
            <>
              Press <kbd className="font-mono text-[#0E7490] dark:text-[#43D9E9]">Alt+V</kbd> or use the bottom-right dock to say{' '}
              <span className="font-mono">“open live recognition”</span>, <span className="font-mono">“open 3D hand studio”</span>,{' '}
              <span className="font-mono">“open vocabulary”</span>, or <span className="font-mono">“translate”</span>.
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
