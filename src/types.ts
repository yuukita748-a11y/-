export type MasteryLevel = 0 | 1 | 2 | 3 | 4; // 0: 未学習, 1: 覚えたて(Box1), 2: 定着中(Box2), 3: 習得(Box3), 4: 完璧(Mastered)

export type LanguageCode = 'en' | 'de' | 'fr' | 'ja' | 'auto';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  shortLabel: string;
  flag: string;
  ttsLang: string;
  specialChars?: string[];
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageOption> = {
  en: {
    code: 'en',
    label: '英語 (English)',
    shortLabel: '英語',
    flag: '🇬🇧',
    ttsLang: 'en-US',
    specialChars: [],
  },
  de: {
    code: 'de',
    label: 'ドイツ語 (Deutsch)',
    shortLabel: 'ドイツ語',
    flag: '🇩🇪',
    ttsLang: 'de-DE',
    specialChars: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
  },
  fr: {
    code: 'fr',
    label: 'フランス語 (Français)',
    shortLabel: 'フランス語',
    flag: '🇫🇷',
    ttsLang: 'fr-FR',
    specialChars: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ç', 'î', 'ï', 'ô', 'ù', 'û', 'œ', 'æ'],
  },
  ja: {
    code: 'ja',
    label: '日本語 (Japanese)',
    shortLabel: '日本語',
    flag: '🇯🇵',
    ttsLang: 'ja-JP',
    specialChars: [],
  },
  auto: {
    code: 'auto',
    label: '自動判定 / その他',
    shortLabel: '自動',
    flag: '🌐',
    ttsLang: 'en-US',
    specialChars: [],
  },
};

export type WordGender = 'masculine' | 'feminine' | 'neuter' | 'none'; // 文法上の性別 (男性/女性/中性/なし)

export interface WordCard {
  id: string;
  deckId: string;
  word: string; // 表面: 単語や質問
  meaning: string; // 裏面: 意味や解答
  language?: LanguageCode; // 言語設定 (英語/ドイツ語/フランス語/日本語/auto)
  gender?: WordGender; // 文法上の性別 (der/le=男性, die/la=女性, das=中性, なし)
  reading?: string; // 発音・ふりがな・カタカナ
  example?: string; // 例文
  exampleMeaning?: string; // 例文の訳
  note?: string; // メモ・解説・語源
  tags: string[]; // タグ
  isFavorite: boolean; // お気に入り (星マーク)
  masteryLevel: MasteryLevel; // 習得度 0〜4
  reviewCount: number; // 復習回数
  correctCount: number; // 正解回数
  incorrectCount: number; // 不正解回数
  lastReviewedAt?: number; // 最終復習日時 (timestamp)
  nextReviewDue?: number; // 次回復習目安 (timestamp)
  createdAt: number;
  updatedAt: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  language?: LanguageCode; // デッキの対象言語 (en, de, fr, ja, auto)
  category?: string;
  color: string; // e.g. 'indigo', 'emerald', 'amber', 'rose', 'sky', 'purple'
  icon?: string;
  lastStudiedAt?: number; // 最終学習日時 (timestamp)
  createdAt: number;
  updatedAt: number;
}

export type StudyMode = 
  | 'flashcard'  // フラッシュカード (めくり学習)
  | 'reveal'     // タップ開示カード (意味隠し・タップ表示＆4段階評価)
  | 'sheet'      // 単語一覧暗記シート (日本語隠し・タップ表示・完璧チェック)
  | 'quiz'       // 4択クイズ
  | 'typing'     // タイピング・スペル確認
  | 'speed'      // 高速自動送り・音読 (ハンズフリー)
  | 'weak';      // 苦手集中特訓

export type FilterType = 
  | 'all' 
  | 'unlearned' 
  | 'learning' 
  | 'mastered' 
  | 'level0' 
  | 'level1' 
  | 'level2' 
  | 'level3' 
  | 'level4' 
  | 'favorite' 
  | 'weak';

export interface ImportPreviewRow {
  word: string;
  meaning: string;
  language?: LanguageCode;
  gender?: WordGender;
  reading?: string;
  example?: string;
  exampleMeaning?: string;
  note?: string;
  tags?: string[];
  isValid: boolean;
  error?: string;
}

export interface ImportSettings {
  targetDeckId: string;
  newDeckTitle: string;
  newDeckCategory: string;
  duplicateAction: 'skip' | 'overwrite' | 'allow';
  delimiter: string;
  hasHeader: boolean;
  columnMapping: {
    word: number;
    meaning: number;
    reading: number;
    example: number;
    exampleMeaning: number;
    note: number;
    tags: number;
  };
}

export interface StudyResult {
  total: number;
  correct: number;
  incorrect: number;
  upgraded: number;
  cards: {
    card: WordCard;
    isCorrect: boolean;
    prevLevel: MasteryLevel;
    newLevel: MasteryLevel;
  }[];
  startTime: number;
  endTime: number;
}
