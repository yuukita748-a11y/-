import { MasteryLevel, WordCard, Deck } from '../types';

export const MASTERY_LABELS: Record<MasteryLevel, { label: string; sub: string; color: string; bg: string; border: string }> = {
  0: { label: '未学習', sub: 'New', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-300' },
  1: { label: '覚えたて', sub: 'Box 1 (要反復)', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
  2: { label: '定着中', sub: 'Box 2 (2〜3日後)', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
  3: { label: '習得済', sub: 'Box 3 (1週間後)', color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-300' },
  4: { label: '完璧', sub: 'Mastered (30日後)', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' },
};

// Next review interval in milliseconds based on Leitner Box
const INTERVALS_MS: Record<MasteryLevel, number> = {
  0: 0,
  1: 1000 * 60 * 60 * 12, // 12 hours
  2: 1000 * 60 * 60 * 24 * 3, // 3 days
  3: 1000 * 60 * 60 * 24 * 7, // 7 days
  4: 1000 * 60 * 60 * 24 * 30, // 30 days
};

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

/**
 * Check if two timestamps fall on the same calendar day (local time)
 */
export const isSameDay = (timestamp1?: number, timestamp2: number = Date.now()): boolean => {
  if (!timestamp1) return false;
  const d1 = new Date(timestamp1);
  const d2 = new Date(timestamp2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Format relative study time string (e.g. 今日 15:30, 昨日, 2日前, 未学習)
 */
export const formatRelativeStudyTime = (timestamp?: number): string => {
  if (!timestamp) return '未学習';
  const now = new Date();
  const date = new Date(timestamp);
  
  if (isSameDay(timestamp, now.getTime())) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `今日 ${hours}:${minutes}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(timestamp, yesterday.getTime())) {
    return '昨日';
  }
  
  const diffDays = Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7 && diffDays > 0) {
    return `${diffDays}日前`;
  }
  
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export interface DeckStudyStatus {
  isStudiedToday: boolean;
  studiedTodayCount: number;
  dueCount: number;
  totalCount: number;
  unlearnedCount: number;
  learningCount: number;
  masteredCount: number;
  masteredPercentage: number;
  allMastered: boolean;
  lastStudiedAt?: number;
  lastStudiedLabel: string;
}

/**
 * Compute comprehensive study status for a deck
 */
export const getDeckStudyStatus = (deck: Deck, deckWords: WordCard[]): DeckStudyStatus => {
  const wordsStudiedToday = deckWords.filter((w) => isSameDay(w.lastReviewedAt));
  const studiedTodayCount = wordsStudiedToday.length;
  
  let latestReviewed = deck.lastStudiedAt || 0;
  for (const w of deckWords) {
    if (w.lastReviewedAt && w.lastReviewedAt > latestReviewed) {
      latestReviewed = w.lastReviewedAt;
    }
  }
  
  const isStudiedToday = studiedTodayCount > 0 || isSameDay(latestReviewed);
  const dueCount = deckWords.filter(isCardDueForReview).length;
  const unlearnedCount = deckWords.filter((w) => w.masteryLevel === 0).length;
  const learningCount = deckWords.filter((w) => w.masteryLevel >= 1 && w.masteryLevel <= 2).length;
  const masteredCount = deckWords.filter((w) => w.masteryLevel >= 3).length;
  const totalCount = deckWords.length;
  const masteredPercentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
  const allMastered = totalCount > 0 && deckWords.every((w) => w.masteryLevel === 4);

  return {
    isStudiedToday,
    studiedTodayCount,
    dueCount,
    totalCount,
    unlearnedCount,
    learningCount,
    masteredCount,
    masteredPercentage,
    allMastered,
    lastStudiedAt: latestReviewed > 0 ? latestReviewed : undefined,
    lastStudiedLabel: formatRelativeStudyTime(latestReviewed > 0 ? latestReviewed : undefined),
  };
};

/**
 * Calculates new mastery level and review timestamps based on grade
 */
export const calculateNextReview = (
  card: WordCard,
  grade: ReviewGrade
): {
  masteryLevel: MasteryLevel;
  nextReviewDue: number;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt: number;
} => {
  const now = Date.now();
  let nextLevel: MasteryLevel = card.masteryLevel;
  let isCorrect = false;

  switch (grade) {
    case 'again': // まだ覚えてない / 不正解 -> Box 1 (Level 1) or stay 0
      nextLevel = 1;
      isCorrect = false;
      break;
    case 'hard': // 難しかったが思い出せた -> Maintain or increment slightly
      nextLevel = card.masteryLevel === 0 ? 1 : card.masteryLevel;
      isCorrect = true;
      break;
    case 'good': // 覚えている / 正解 -> Advance 1 stage
      nextLevel = Math.min(4, card.masteryLevel + 1) as MasteryLevel;
      isCorrect = true;
      break;
    case 'easy': // 簡単・完璧 -> Jump 2 stages or straight to max
      nextLevel = Math.min(4, Math.max(3, card.masteryLevel + 2)) as MasteryLevel;
      isCorrect = true;
      break;
  }

  const interval = INTERVALS_MS[nextLevel] || 0;
  const nextReviewDue = now + interval;

  return {
    masteryLevel: nextLevel,
    nextReviewDue,
    reviewCount: card.reviewCount + 1,
    correctCount: isCorrect ? card.correctCount + 1 : card.correctCount,
    incorrectCount: isCorrect ? card.incorrectCount : card.incorrectCount + 1,
    lastReviewedAt: now,
  };
};

/**
 * Checks if a word is due for review
 */
export const isCardDueForReview = (card: WordCard): boolean => {
  if (card.masteryLevel === 0) return true; // Unlearned cards are always ready
  if (!card.nextReviewDue) return true;
  return Date.now() >= card.nextReviewDue;
};

/**
 * Filters words for weak/intensive review
 */
export const isWeakCard = (card: WordCard): boolean => {
  if (card.isFavorite) return true;
  if (card.incorrectCount > 0 && card.incorrectCount >= card.correctCount) return true;
  if (card.masteryLevel === 1 && card.reviewCount >= 2) return true;
  return false;
};
