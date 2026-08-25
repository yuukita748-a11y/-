import { WordCard, LanguageCode } from '../types';

export type WordGender = 'masculine' | 'feminine' | 'neuter' | 'none';

export interface GenderConfig {
  key: WordGender;
  label: string;
  shortLabel: string;
  symbol: string;
  articleHint: string;
  cardBgClass: string;
  cardBackBgClass: string;
  cardBorderClass: string;
  badgeClass: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  textAccent: string;
  rowHoverBg: string;
  indicatorColor: string;
}

export const GENDER_CONFIGS: Record<WordGender, GenderConfig> = {
  masculine: {
    key: 'masculine',
    label: '男性名詞',
    shortLabel: '男性',
    symbol: '♂',
    articleHint: 'der / le / el (m)',
    cardBgClass: 'bg-gradient-to-b from-sky-50/95 via-blue-50/60 to-indigo-50/30',
    cardBackBgClass: 'bg-gradient-to-b from-sky-50/95 via-blue-50/70 to-indigo-100/40',
    cardBorderClass: 'border-sky-300 hover:border-sky-400 shadow-sky-500/10',
    badgeClass: 'bg-sky-100/90 text-sky-800 border-sky-300',
    pillBg: 'bg-sky-50',
    pillText: 'text-sky-700',
    pillBorder: 'border-sky-200',
    textAccent: 'text-sky-700',
    rowHoverBg: 'hover:bg-sky-50/40',
    indicatorColor: 'bg-sky-500',
  },
  feminine: {
    key: 'feminine',
    label: '女性名詞',
    shortLabel: '女性',
    symbol: '♀',
    articleHint: 'die / la / une (f)',
    cardBgClass: 'bg-gradient-to-b from-rose-50/95 via-pink-50/60 to-purple-50/30',
    cardBackBgClass: 'bg-gradient-to-b from-rose-50/95 via-pink-50/70 to-purple-100/40',
    cardBorderClass: 'border-rose-300 hover:border-rose-400 shadow-rose-500/10',
    badgeClass: 'bg-rose-100/90 text-rose-800 border-rose-300',
    pillBg: 'bg-rose-50',
    pillText: 'text-rose-700',
    pillBorder: 'border-rose-200',
    textAccent: 'text-rose-700',
    rowHoverBg: 'hover:bg-rose-50/40',
    indicatorColor: 'bg-rose-500',
  },
  neuter: {
    key: 'neuter',
    label: '中性名詞',
    shortLabel: '中性',
    symbol: '⚪',
    articleHint: 'das (n)',
    cardBgClass: 'bg-gradient-to-b from-emerald-50/95 via-teal-50/60 to-green-50/30',
    cardBackBgClass: 'bg-gradient-to-b from-emerald-50/95 via-teal-50/70 to-emerald-100/40',
    cardBorderClass: 'border-emerald-300 hover:border-emerald-400 shadow-emerald-500/10',
    badgeClass: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
    pillBg: 'bg-emerald-50',
    pillText: 'text-emerald-700',
    pillBorder: 'border-emerald-200',
    textAccent: 'text-emerald-700',
    rowHoverBg: 'hover:bg-emerald-50/40',
    indicatorColor: 'bg-emerald-500',
  },
  none: {
    key: 'none',
    label: '指定なし',
    shortLabel: 'なし',
    symbol: '—',
    articleHint: '指定なし / その他',
    cardBgClass: 'bg-white',
    cardBackBgClass: 'bg-gradient-to-b from-white to-indigo-50/20',
    cardBorderClass: 'border-slate-200/90 hover:border-indigo-300 shadow-slate-900/5',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    pillBg: 'bg-slate-50',
    pillText: 'text-slate-600',
    pillBorder: 'border-slate-200',
    textAccent: 'text-slate-700',
    rowHoverBg: 'hover:bg-slate-50',
    indicatorColor: 'bg-transparent',
  },
};

/**
 * Intelligently detect word gender from text, articles, tags, or notes
 */
export const detectGenderFromContent = (
  word: string,
  tags?: string[],
  note?: string,
  language?: LanguageCode
): WordGender => {
  const w = (word || '').trim().toLowerCase();
  const n = (note || '').toLowerCase();
  const allTags = (tags || []).map((t) => t.toLowerCase());

  // 1. Explicit tags check
  if (
    allTags.some((t) => ['masculine', '男性', '男性名詞', 'm', 'der', 'le', '陽性'].includes(t)) ||
    n.includes('男性名詞') ||
    n.includes('(m)') ||
    n.includes('[m]') ||
    n.includes('masculine')
  ) {
    return 'masculine';
  }

  if (
    allTags.some((t) => ['feminine', '女性', '女性名詞', 'f', 'die', 'la', '陰性'].includes(t)) ||
    n.includes('女性名詞') ||
    n.includes('(f)') ||
    n.includes('[f]') ||
    n.includes('feminine')
  ) {
    return 'feminine';
  }

  if (
    allTags.some((t) => ['neuter', '中性', '中性名詞', 'n', 'das'].includes(t)) ||
    n.includes('中性名詞') ||
    n.includes('(n)') ||
    n.includes('[n]') ||
    n.includes('neuter')
  ) {
    return 'neuter';
  }

  // 2. German articles (der, die, das)
  if (w.startsWith('der ') || w.startsWith('der-') || w.startsWith('(der)')) {
    return 'masculine';
  }
  if (w.startsWith('die ') || w.startsWith('die-') || w.startsWith('(die)')) {
    return 'feminine';
  }
  if (w.startsWith('das ') || w.startsWith('das-') || w.startsWith('(das)')) {
    return 'neuter';
  }

  // 3. French articles (le/un vs la/une)
  if (w.startsWith('le ') || w.startsWith('un ') || w.startsWith('(le)')) {
    return 'masculine';
  }
  if (w.startsWith('la ') || w.startsWith('une ') || w.startsWith('(la)')) {
    return 'feminine';
  }

  // 4. Spanish / Italian articles (el/la, il/lo/la)
  if (w.startsWith('el ') || w.startsWith('il ') || w.startsWith('lo ')) {
    return 'masculine';
  }
  if (w.startsWith('la ') || w.startsWith('una ')) {
    return 'feminine';
  }

  // Suffix hints (for German) if language is German
  if (language === 'de') {
    if (
      w.endsWith('ung') ||
      w.endsWith('heit') ||
      w.endsWith('keit') ||
      w.endsWith('schaft') ||
      w.endsWith('ion') ||
      w.endsWith('tät') ||
      w.endsWith('ur')
    ) {
      return 'feminine';
    }
    if (
      w.endsWith('chen') ||
      w.endsWith('lein') ||
      w.endsWith('ment') ||
      w.endsWith('um') ||
      w.endsWith('tum')
    ) {
      return 'neuter';
    }
    if (
      w.endsWith('ismus') ||
      w.endsWith('or') ||
      w.endsWith('ling') ||
      w.endsWith('ant')
    ) {
      return 'masculine';
    }
  }

  return 'none';
};

/**
 * Get effective gender for a card
 */
export const getCardGender = (card: Partial<WordCard> | null | undefined): WordGender => {
  if (!card) return 'none';
  if (card.gender && card.gender !== 'none') {
    return card.gender;
  }
  // If explicitly set to 'none', still check if it can be inferred, or return 'none'
  if (card.gender === 'none') {
    return 'none';
  }
  return detectGenderFromContent(
    card.word || '',
    card.tags,
    card.note,
    card.language
  );
};
