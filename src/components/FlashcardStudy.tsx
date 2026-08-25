import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Star, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  Sparkles, 
  RefreshCw,
  Eye,
  EyeOff,
  Shuffle,
  Layers,
  HelpCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { WordCard, MasteryLevel } from '../types';
import { MASTERY_LABELS, calculateNextReview, ReviewGrade } from '../utils/srs';
import { speakWord, sounds } from '../utils/sound';
import { AppSettings } from '../utils/storage';
import { getCardGender, GENDER_CONFIGS } from '../utils/gender';

interface FlashcardStudyProps {
  cards: WordCard[];
  onUpdateCard: (updatedCard: WordCard, isCorrect: boolean, prevLevel: MasteryLevel, newLevel: MasteryLevel) => void;
  onFinishSession: () => void;
  settings: AppSettings;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({
  cards,
  onUpdateCard,
  onFinishSession,
  settings,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [swapSides, setSwapSides] = useState<boolean>(settings.cardFrontSide === 'meaning');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [studyList, setStudyList] = useState<WordCard[]>(cards);

  const currentCard = studyList[currentIndex];
  const isFinished = currentIndex >= studyList.length;

  const cardGender = settings.showGenderColors !== false ? getCardGender(currentCard) : 'none';
  const genderConfig = GENDER_CONFIGS[cardGender];

  // Auto pronunciation when new card appears
  useEffect(() => {
    if (currentCard && settings.autoAudio && !isFlipped) {
      const textToSpeak = swapSides ? currentCard.meaning : currentCard.word;
      speakWord(textToSpeak, currentCard.language || 'en');
    }
  }, [currentIndex, swapSides, isFlipped]);

  // Flip card
  const handleFlip = useCallback(() => {
    if (settings.soundFx) sounds.playFlip();
    setIsFlipped((prev) => !prev);
  }, [settings.soundFx]);

  // Submit grade (Again, Hard, Good, Easy)
  const handleGrade = useCallback(
    (grade: ReviewGrade) => {
      if (!currentCard) return;

      if (settings.soundFx) {
        if (grade === 'again') {
          sounds.playIncorrect();
        } else {
          sounds.playCorrect();
        }
      }

      const prevLevel = currentCard.masteryLevel;
      const srsUpdate = calculateNextReview(currentCard, grade);
      const isCorrect = grade !== 'again';

      const updatedCard: WordCard = {
        ...currentCard,
        ...srsUpdate,
      };

      onUpdateCard(updatedCard, isCorrect, prevLevel, updatedCard.masteryLevel);

      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentCard, settings.soundFx, onUpdateCard]
  );

  // Toggle favorite
  const handleToggleFavorite = () => {
    if (!currentCard) return;
    const updated: WordCard = {
      ...currentCard,
      isFavorite: !currentCard.isFavorite,
      updatedAt: Date.now(),
    };
    onUpdateCard(updated, true, currentCard.masteryLevel, currentCard.masteryLevel);
  };

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === '1') {
        e.preventDefault();
        handleGrade('again');
      } else if (e.key === '2') {
        e.preventDefault();
        handleGrade('hard');
      } else if (e.key === '3') {
        e.preventDefault();
        handleGrade('good');
      } else if (e.key === '4') {
        e.preventDefault();
        handleGrade('easy');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (currentCard) {
          speakWord(swapSides ? currentCard.meaning : currentCard.word, currentCard.language || 'en');
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFavorite();
      } else if (e.key === 'ArrowRight' && isFlipped) {
        e.preventDefault();
        handleGrade('good');
      } else if (e.key === 'ArrowLeft' && isFlipped) {
        e.preventDefault();
        handleGrade('again');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleGrade, currentCard, swapSides, isFlipped]);

  // If cards are empty or finished
  if (!currentCard || isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-md">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">このセッションの単語はすべて完了しました！</h3>
        <p className="text-sm text-slate-500 mb-6">学習結果と復習サイクルが更新されました。</p>
        <button
          id="btn-finish-flashcards"
          onClick={onFinishSession}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all hover:scale-105"
        >
          結果サマリーを見る
        </button>
      </div>
    );
  }

  const masteryInfo = MASTERY_LABELS[currentCard.masteryLevel];
  const progressPercent = Math.round(((currentIndex) / studyList.length) * 100);

  const frontContent = swapSides ? currentCard.meaning : currentCard.word;
  const backContent = swapSides ? currentCard.word : currentCard.meaning;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Top Session Progress Bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono">
            {currentIndex + 1} / {studyList.length}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${masteryInfo.bg} ${masteryInfo.color} border ${masteryInfo.border}`}>
            {masteryInfo.label} ({masteryInfo.sub})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Swap Sides Toggle */}
          <button
            id="btn-swap-sides"
            onClick={() => setSwapSides((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium transition-colors"
            title="表面と裏面を入れ替える（日→英 / 英→日）"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{swapSides ? '意味 → 単語' : '単語 → 意味'}</span>
          </button>

          {/* Audio Button */}
          <button
            id="btn-audio-speak"
            onClick={() => speakWord(swapSides ? currentCard.meaning : currentCard.word, currentCard.language || 'en')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            title="発音を再生 (キー: S)"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Star Favorite */}
          <button
            id="btn-toggle-card-favorite"
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-lg border transition-colors ${
              currentCard.isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-500'
                : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
            }`}
            title="お気に入り / 苦手マーク (キー: F)"
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
        <div 
          className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Flip Flashcard with AnimatePresence to prevent any back-side leakage on transition */}
      <div 
        className="w-full min-h-[360px] sm:min-h-[400px] cursor-pointer select-none"
        style={{ perspective: 1200 }}
        onClick={handleFlip}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id || currentIndex}
            id="flashcard-card-surface"
            className="relative w-full h-full min-h-[360px] sm:min-h-[400px]"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              rotateY: isFlipped ? 180 : 0 
            }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ 
              duration: 0.35, 
              ease: [0.23, 1, 0.32, 1] 
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* FRONT FACE */}
            <div
              className={`absolute inset-0 w-full h-full rounded-3xl shadow-xl border-2 p-6 sm:p-10 flex flex-col justify-between items-center text-center transition-all hover:shadow-2xl ${
                cardGender !== 'none'
                  ? `${genderConfig.cardBgClass} ${genderConfig.cardBorderClass}`
                  : 'bg-white border-slate-200/90 hover:border-indigo-300'
              } ${isFlipped ? 'pointer-events-none' : ''}`}
              style={{ 
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
                visibility: isFlipped ? 'hidden' : 'visible',
              }}
            >
              {/* Front Top Meta */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cardGender !== 'none' && (
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold shadow-2xs flex items-center gap-1 ${genderConfig.badgeClass}`}>
                      <span>{genderConfig.symbol}</span>
                      <span>{genderConfig.label}</span>
                      <span className="opacity-75 font-mono text-[10px]">({genderConfig.articleHint})</span>
                    </span>
                  )}
                  {currentCard.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-600 text-[10px] font-medium border border-slate-200/60">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  表面 (タップまたはSpaceでめくる)
                </span>
              </div>

              {/* Front Main Content */}
              <div className="my-auto py-4 flex flex-col items-center justify-center space-y-3 w-full">
                <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {frontContent}
                </h2>

                {/* Phonetic / Reading (if target word front) */}
                {!swapSides && currentCard.reading && settings.showPhonetic && (
                  <div className="inline-block px-3 py-1 rounded-full bg-white/80 text-indigo-700 font-mono text-sm border border-indigo-100 shadow-2xs">
                    /{currentCard.reading}/
                  </div>
                )}

                {/* Example sentence hint on front if toggled */}
                {currentCard.example && showHint && (
                  <div className="text-xs text-slate-600 bg-white/90 p-2.5 rounded-xl border border-slate-200 mt-2 max-w-md mx-auto shadow-2xs">
                    💡 例文ヒント: {currentCard.example}
                  </div>
                )}
              </div>

              {/* Front Bottom Flip Hint */}
              <div className="w-full pt-3 border-t border-slate-200/60 text-center">
                <span className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                  <span>タップまたは [Space] で裏面へ</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                </span>
              </div>
            </div>

            {/* BACK FACE */}
            <div
              className={`absolute inset-0 w-full h-full rounded-3xl shadow-xl border-2 p-6 sm:p-10 flex flex-col justify-between items-center text-center transition-all hover:shadow-2xl ${
                cardGender !== 'none'
                  ? `${genderConfig.cardBackBgClass} ${genderConfig.cardBorderClass}`
                  : 'bg-gradient-to-b from-white to-indigo-50/20 border-indigo-300'
              } ${!isFlipped ? 'pointer-events-none' : ''}`}
              style={{ 
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                visibility: !isFlipped ? 'hidden' : 'visible',
              }}
            >
              {/* Back Top Meta */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-indigo-100/70 pb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                    解答・意味
                  </span>
                  {cardGender !== 'none' && (
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${genderConfig.badgeClass}`}>
                      {genderConfig.symbol} {genderConfig.label}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  裏面
                </span>
              </div>

              {/* Back Main Content */}
              <div className="my-auto py-2 flex flex-col items-center justify-center space-y-3 w-full max-w-lg overflow-y-auto max-h-[220px]">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 leading-relaxed font-sans">
                  {backContent}
                </h3>

                {/* Reading on back if swapped */}
                {swapSides && currentCard.reading && (
                  <div className="text-xs font-mono text-indigo-600">
                    /{currentCard.reading}/
                  </div>
                )}

                {/* Example */}
                {currentCard.example && (
                  <div className="bg-slate-50/90 rounded-2xl p-3 text-left border border-slate-200 text-xs text-slate-700 space-y-1 w-full">
                    <div className="font-medium text-slate-800 leading-relaxed">
                      💬 {currentCard.example}
                    </div>
                    {currentCard.exampleMeaning && (
                      <div className="text-slate-500 text-[11px]">
                        訳: {currentCard.exampleMeaning}
                      </div>
                    )}
                  </div>
                )}

                {/* Note / Etymology */}
                {currentCard.note && (
                  <div className="text-xs text-slate-600 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2 text-left leading-relaxed w-full">
                    📝 <strong>メモ:</strong> {currentCard.note}
                  </div>
                )}
              </div>

              {/* Back Bottom Flip Hint */}
              <div className="w-full pt-3 border-t border-indigo-100 text-center">
                <span className="text-xs text-indigo-600 font-semibold">
                  下のボタンまたは数字キー (1〜4) で定着度を記録
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Grading Action Buttons (Leitner SuperMemo SRS) */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          {/* Again (1) */}
          <button
            id="btn-grade-again"
            onClick={(e) => {
              e.stopPropagation();
              handleGrade('again');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border-2 border-rose-200 text-rose-700 transition-all shadow-xs group hover:scale-[1.02]"
          >
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <X className="w-4 h-4" />
              <span>まだ / 苦手</span>
            </div>
            <span className="text-[10px] text-rose-500 mt-0.5">キー: [1] (要復習)</span>
          </button>

          {/* Hard (2) */}
          <button
            id="btn-grade-hard"
            onClick={(e) => {
              e.stopPropagation();
              handleGrade('hard');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border-2 border-amber-200 text-amber-800 transition-all shadow-xs group hover:scale-[1.02]"
          >
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <Clock className="w-4 h-4" />
              <span>難しかった</span>
            </div>
            <span className="text-[10px] text-amber-600 mt-0.5">キー: [2] (1日後)</span>
          </button>

          {/* Good (3) */}
          <button
            id="btn-grade-good"
            onClick={(e) => {
              e.stopPropagation();
              handleGrade('good');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border-2 border-blue-200 text-blue-800 transition-all shadow-xs group hover:scale-[1.02]"
          >
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <Check className="w-4 h-4" />
              <span>覚えた</span>
            </div>
            <span className="text-[10px] text-blue-600 mt-0.5">キー: [3] (3日後)</span>
          </button>

          {/* Easy (4) */}
          <button
            id="btn-grade-easy"
            onClick={(e) => {
              e.stopPropagation();
              handleGrade('easy');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border-2 border-emerald-200 text-emerald-800 transition-all shadow-xs group hover:scale-[1.02]"
          >
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <Sparkles className="w-4 h-4" />
              <span>完璧</span>
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5">キー: [4] (7日後)</span>
          </button>

        </div>

        {/* Quick Hint / Flip Footer */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <button
            onClick={() => setShowHint((p) => !p)}
            className="hover:text-slate-700 flex items-center gap-1"
          >
            {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showHint ? 'ヒントを隠す' : '例文ヒントを表示'}
          </button>
          <span>復習回数: {currentCard.reviewCount} 回 (正解率: {currentCard.reviewCount > 0 ? Math.round((currentCard.correctCount / currentCard.reviewCount) * 100) : 0}%)</span>
        </div>
      </div>

    </div>
  );
};
