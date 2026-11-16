import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Video,
  ArrowLeftRight,
  Captions,
  Languages,
  Bot,
  FileText,
  ScanFace,
  BookOpen,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { ActiveModule } from '../types';

export type AppLanguage = 'en' | 'am';

export type NavActionId = 'open-settings' | 'open-help';

export type NavItemKind = 'route' | 'action';

export interface NavItemConfig {
  id: string;
  kind: NavItemKind;
  moduleId?: ActiveModule;
  actionId?: NavActionId;
  hashSlug?: string;
  labelEn: string;
  labelAm: string;
  descriptionEn: string;
  descriptionAm: string;
  icon: LucideIcon;
  shortcutNum?: number;
}

export interface NavGroupConfig {
  id: 'workspace' | 'communication' | 'tools' | 'learning' | 'account';
  labelEn: string;
  labelAm: string;
  placement: 'primary' | 'footer';
  items: NavItemConfig[];
}

export const PRIMARY_NAVIGATION_GROUPS: NavGroupConfig[] = [
  {
    id: 'workspace',
    labelEn: 'WORKSPACE',
    labelAm: 'የስራ ቦታ',
    placement: 'primary',
    items: [
      {
        id: 'overview',
        kind: 'route',
        moduleId: 'overview',
        hashSlug: 'overview',
        labelEn: 'Overview',
        labelAm: 'አጠቃላይ እይታ',
        descriptionEn: 'Initiative story, sign communication studio & setup guide',
        descriptionAm: 'የፕሮጀክቱ መግለጫ፣ የ2D መከታተያ እና የካሜራ መመሪያ',
        icon: LayoutDashboard,
        shortcutNum: 1,
      },
    ],
  },
  {
    id: 'communication',
    labelEn: 'COMMUNICATION',
    labelAm: 'መገናኛ',
    placement: 'primary',
    items: [
      {
        id: 'live-recognition',
        kind: 'route',
        moduleId: 'live-recognition',
        hashSlug: 'live-recognition',
        labelEn: 'Live Recognition',
        labelAm: 'የቀጥታ ምልክት ማንበቢያ',
        descriptionEn: 'Real-time camera sign detection to English & Amharic speech',
        descriptionAm: 'በካሜራ የምልክት ቋንቋን በቀጥታ ወደ ድምጽ መቀየሪያ',
        icon: Video,
        shortcutNum: 2,
      },
      {
        id: 'two-way',
        kind: 'route',
        moduleId: 'studio',
        hashSlug: 'two-way',
        labelEn: 'Two-Way Communication',
        labelAm: 'ባለሁለት አቅጣጫ መገናኛ',
        descriptionEn: 'Hands-to-Voice & Voice/Text-to-Sign translation',
        descriptionAm: 'ምልክት ወደ ድምጽ እና ድምጽ ወደ ምልክት ትርጉም',
        icon: ArrowLeftRight,
        shortcutNum: 3,
      },
      {
        id: 'speech-captions',
        kind: 'route',
        moduleId: 'captions',
        hashSlug: 'captions',
        labelEn: 'Speech Captions',
        labelAm: 'የድምጽ ጽሑፍ መግለጫ',
        descriptionEn: 'Live streaming speech-to-text transcription',
        descriptionAm: 'ንግግርን በቀጥታ ወደ ጽሑፍ መቀየሪያ',
        icon: Captions,
        shortcutNum: 4,
      },
      {
        id: 'translate',
        kind: 'route',
        moduleId: 'translate',
        hashSlug: 'translate',
        labelEn: 'Language Translator',
        labelAm: 'የቋንቋ ተርጓሚ',
        descriptionEn: 'Bilingual Amharic, English & multi-language translation',
        descriptionAm: 'የአማርኛ፣ እንግሊዝኛ እና ሌሎች ቋንቋዎች ትርጉም',
        icon: Languages,
        shortcutNum: 5,
      },
      {
        id: 'assistant',
        kind: 'route',
        moduleId: 'assistant',
        hashSlug: 'assistant',
        labelEn: 'AI Assistant',
        labelAm: 'የAI አጋዥ',
        descriptionEn: 'Simplify complex messages and suggest accessible replies',
        descriptionAm: 'መልእክቶችን ማቃለል እና ምላሾችን ማዘጋጀት',
        icon: Bot,
        shortcutNum: 6,
      },
    ],
  },
  {
    id: 'tools',
    labelEn: 'TOOLS',
    labelAm: 'መሳሪያዎች',
    placement: 'primary',
    items: [
      {
        id: 'ocr',
        kind: 'route',
        moduleId: 'documents',
        hashSlug: 'ocr',
        labelEn: 'Text Extraction (OCR)',
        labelAm: 'ከምስል ጽሑፍ ማውጫ (OCR)',
        descriptionEn: 'Extract and simplify text from documents and photos',
        descriptionAm: 'ከሰነዶች እና ፎቶዎች ጽሑፍ ማውጣት እና ማቃለል',
        icon: FileText,
        shortcutNum: 7,
      },
      {
        id: 'tracking-studio',
        kind: 'route',
        moduleId: 'tracking-studio',
        hashSlug: '2d-tracking-studio',
        labelEn: '2D Tracking Studio',
        labelAm: '2D የሰውነት እና የእጅ መከታተያ',
        descriptionEn: 'Real-time 2D face mesh, body skeleton & dual-hand tracking',
        descriptionAm: 'የቀጥታ 2D የፊት፣ የሰውነት አፅም እና የሁለት እጆች መከታተያ ስቱዲዮ',
        icon: ScanFace,
        shortcutNum: 8,
      },
    ],
  },
  {
    id: 'learning',
    labelEn: 'LEARNING',
    labelAm: 'መማሪያ',
    placement: 'primary',
    items: [
      {
        id: 'vocabulary',
        kind: 'route',
        moduleId: 'vocabulary',
        hashSlug: 'vocabulary',
        labelEn: 'Vocabulary',
        labelAm: 'የምልክት ቃላት መማሪያ',
        descriptionEn: 'Ethiopian Sign Language (EthSL) dictionary & Fidel curriculum',
        descriptionAm: 'የኢትዮጵያ ምልክት ቋንቋ መዝገበ-ቃላት እና ፊደላት',
        icon: BookOpen,
        shortcutNum: 9,
      },
    ],
  },
];

export const ACCOUNT_NAVIGATION_GROUP: NavGroupConfig = {
  id: 'account',
  labelEn: 'ACCOUNT',
  labelAm: 'መለያ እና ድጋፍ',
  placement: 'footer',
  items: [
    {
      id: 'settings',
      kind: 'action',
      actionId: 'open-settings',
      labelEn: 'Settings',
      labelAm: 'ቅንብሮች',
      descriptionEn: 'Text size, contrast, speech voice & accessibility preferences',
      descriptionAm: 'የጽሑፍ መጠን፣ ንጽጽር እና የድምጽ ምርጫዎች',
      icon: Settings,
    },
    {
      id: 'help',
      kind: 'action',
      actionId: 'open-help',
      labelEn: 'Help & Support',
      labelAm: 'እርዳታ እና ድጋፍ',
      descriptionEn: 'Shortcuts, voice commands, evaluation lab & privacy architecture',
      descriptionAm: 'አቋራጭ ቁልፎች፣ የድምጽ ትእዛዞች እና የግላዊነት መረጃ',
      icon: HelpCircle,
    },
  ],
};

export const ALL_ROUTE_ITEMS: NavItemConfig[] = PRIMARY_NAVIGATION_GROUPS.flatMap(
  (group) => group.items
);

export function getRouteMetadata(moduleId: ActiveModule): {
  group: NavGroupConfig;
  item: NavItemConfig;
} {
  for (const group of PRIMARY_NAVIGATION_GROUPS) {
    const found = group.items.find((item) => item.moduleId === moduleId);
    if (found) {
      return { group, item: found };
    }
  }
  return {
    group: PRIMARY_NAVIGATION_GROUPS[0],
    item: PRIMARY_NAVIGATION_GROUPS[0].items[0],
  };
}

export function resolveModuleFromHash(hash: string): ActiveModule | null {
  const clean = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (!clean) return null;

  const matched = ALL_ROUTE_ITEMS.find(
    (item) => item.hashSlug === clean || item.moduleId === clean
  );
  if (matched?.moduleId) return matched.moduleId;

  if (clean === 'communication-workspace') return 'studio';
  if (clean === 'module-workspace') return 'studio';
  if (clean === '3d-hand-studio' || clean === 'hand-studio') return 'tracking-studio';
  return null;
}

export function getAppLanguage(preferredLanguage: string | undefined): AppLanguage {
  return preferredLanguage?.toLowerCase().startsWith('am') ? 'am' : 'en';
}
