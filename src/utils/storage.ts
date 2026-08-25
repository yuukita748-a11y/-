import { Deck, WordCard } from '../types';
import { INITIAL_DECKS, INITIAL_WORDS } from '../data/presets';

const STORAGE_KEYS = {
  DECKS: 'memorize_app_decks_v1',
  WORDS: 'memorize_app_words_v1',
  ACTIVE_DECK: 'memorize_app_active_deck_v1',
  SETTINGS: 'memorize_app_settings_v1',
};

export interface AppSettings {
  autoAudio: boolean;
  quizTimer: number; // 0 for off, or seconds (e.g. 10)
  cardFrontSide: 'word' | 'meaning';
  soundFx: boolean;
  theme: 'light' | 'dark' | 'system';
  showPhonetic: boolean;
  showExample: boolean;
  showTags: boolean;
  showGenderColors: boolean; // 単語の性別によるカード色分け (男性:青, 女性:赤/ピンク, 中性:緑)
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoAudio: true,
  quizTimer: 10,
  cardFrontSide: 'word',
  soundFx: true,
  theme: 'light',
  showPhonetic: true,
  showExample: true,
  showTags: true,
  showGenderColors: true,
};

export const loadDecks = (): Deck[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(INITIAL_DECKS));
      return INITIAL_DECKS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load decks from localStorage', e);
    return INITIAL_DECKS;
  }
};

export const saveDecks = (decks: Deck[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  } catch (e) {
    console.error('Failed to save decks', e);
  }
};

export const loadWords = (): WordCard[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORDS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(INITIAL_WORDS));
      return INITIAL_WORDS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load words from localStorage', e);
    return INITIAL_WORDS;
  }
};

export const saveWords = (words: WordCard[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
  } catch (e) {
    console.error('Failed to save words', e);
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};

export const loadActiveDeckId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_DECK) || INITIAL_DECKS[0].id;
  } catch {
    return INITIAL_DECKS[0].id;
  }
};

export const saveActiveDeckId = (deckId: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DECK, deckId);
  } catch (e) {
    console.error('Failed to save active deck id', e);
  }
};

export const resetToInitialData = () => {
  localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(INITIAL_DECKS));
  localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(INITIAL_WORDS));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_DECK, INITIAL_DECKS[0].id);
};

export const resetAllProgress = () => {
  const currentWords = loadWords();
  const resetWords = currentWords.map((w) => ({
    ...w,
    masteryLevel: 0 as const,
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    nextReviewDue: undefined,
    lastReviewedAt: undefined,
    updatedAt: Date.now(),
  }));
  saveWords(resetWords);
  return resetWords;
};

export const clearAllDataToEmpty = () => {
  const emptyDeck: Deck = {
    id: `deck-${Date.now()}`,
    title: '新しい単語帳',
    description: '単語を追加またはインポートして始めましょう',
    category: '一般',
    language: 'en',
    color: 'indigo',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const emptyDecks = [emptyDeck];
  const emptyWords: WordCard[] = [];
  saveDecks(emptyDecks);
  saveWords(emptyWords);
  saveActiveDeckId(emptyDeck.id);
  return { decks: emptyDecks, words: emptyWords, activeDeckId: emptyDeck.id };
};
