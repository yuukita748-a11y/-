import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Star, 
  Check, 
  X, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Shuffle, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Lock, 
  Unlock,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { WordCard, MasteryLevel } from '../types';
import { MASTERY_LABELS, calculateNextReview, ReviewGrade } from '../utils/srs';
import { speakWord, sounds } from '../utils/sound';
import { AppSettings } from '../utils/storage';
import { getCardGender, GENDER_CONFIGS } from '../utils/gender';

interface RevealCardStudyProps {
  cards: WordCard[];
  onUpdateCard: (updatedCard: WordCard, isCorrect: boolean, prevLevel: MasteryLevel, newLevel: MasteryLevel) => void;
  onFinishSession: () => void;
  settings: AppSettings;
}

export const RevealCardStudy: React.FC<RevealCardStudyProps> = ({
  cards,
  onUpdateCard,
  onFinishSession,
  settings,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [swapSides, setSwapSides] = useState<boolean>(settings.cardFrontSide === 'meaning');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [studyList] = useState<WordCard[]>(cards);

  const currentCard = studyList[currentIndex];
  const isFinished = currentIndex >= studyList.length;

  const cardGender = settings.showGenderColors !== false ? getCardGender(currentCard) : 'none';
  const genderConfig = GENDER_CONFIGS[cardGender];

  // Auto pronunciation when new card appears
  useEffect(() => {
    if (currentCard && settings.autoAudio && !isRevealed) {
      const textToSpeak = swapSides ? currentCard.meaning : currentCard.word;
      speakWord(textToSpeak, currentCard.language || 'en');
    }
  }, [currentIndex, swapSides, isRevealed, currentCard, settings.autoAudio]);

  // Toggle reveal
  const handleToggleReveal = useCallback(() => {
    if (settings.soundFx) sounds.playFlip();
    setIsRevealed((prev) => !prev);
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

      setIsRevealed(false);
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

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleToggleReveal();
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
      } else if (e.key === 'ArrowRight' && isRevealed) {
        e.preventDefault();
        handleGrade('good');
      } else if (e.key === 'ArrowLeft' && isRevealed) {
        e.preventDefault();
        handleGrade('again');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleReveal, handleGrade, currentCard, swapSides, isRevealed]);

  // If cards are empty or finished
  if (!currentCard || isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-md">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">このセッションの単語はすべて完了しました！</h3>
        <p className="text-sm text-slate-500 mb-6">学習結果と復習サイクルが更新されました。</p>
        <button
          id="btn-finish-reveal-study"
          onClick={onFinishSession}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
        >
          結果サマリーを見る
        </button>
      </div>
    );
  }

  const masteryInfo = MASTERY_LABELS[currentCard.masteryLevel];
  const progressPercent = Math.round((currentIndex / studyList.length) * 100);

  const mainPrompt = swapSides ? currentCard.meaning : currentCard.word;
  const hiddenAnswer = swapSides ? currentCard.word : currentCard.meaning;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      
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
            id="btn-reveal-swap-sides"
            onClick={() => setSwapSides((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium transition-colors cursor-pointer"
            title="単語と意味の表示位置を入れ替える"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{swapSides ? '意味 → 単語' : '単語 → 意味'}</span>
          </button>

          {/* Audio Button */}
          <button
            id="btn-reveal-audio-speak"
            onClick={() => speakWord(swapSides ? currentCard.meaning : currentCard.word, currentCard.language || 'en')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="発音を再生 (キー: S)"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Star Favorite */}
          <button
            id="btn-reveal-toggle-favorite"
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
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

      {/* Single Face Card with Masked Meaning Area */}
      <div
        id="reveal-study-card"
        className={`w-full bg-white rounded-3xl border-2 shadow-lg transition-all overflow-hidden ${
          cardGender !== 'none' ? genderConfig.cardBorderClass : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Card Header Tag */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
              {swapSides ? '意味 (出題)' : '単語 (出題)'}
            </span>
            {cardGender !== 'none' && (
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${genderConfig.badgeClass}`}>
                {genderConfig.symbol} {genderConfig.label}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            スペースキーまたはタップで開閉
          </span>
        </div>

        {/* Card Body: Upper Word Section */}
        <div className="p-6 sm:p-8 text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {mainPrompt}
          </h2>

          {/* Reading / Phonetics (if not swapped) */}
          {!swapSides && currentCard.reading && (
            <div className="text-sm font-mono text-indigo-600">
              /{currentCard.reading}/
            </div>
          )}

          {/* Optional peek hint if user clicks hint toggle */}
          {showHint && currentCard.example && (
            <div className="bg-slate-50 rounded-2xl p-3 text-left border border-slate-200 text-xs text-slate-700 space-y-1 max-w-lg mx-auto animate-in fade-in duration-150">
              <div className="font-medium text-slate-800">
                💬 例文ヒント: {currentCard.example}
              </div>
            </div>
          )}
        </div>

        {/* Card Lower: Hidden / Revealed Meaning Section (Interactive Tap to Open) */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8">
          <div 
            onClick={handleToggleReveal}
            className={`w-full rounded-2xl transition-all cursor-pointer select-none p-5 relative overflow-hidden border-2 ${
              isRevealed
                ? 'bg-gradient-to-br from-indigo-50/70 via-indigo-50/40 to-slate-50 border-indigo-300 shadow-inner'
                : 'bg-slate-100/90 hover:bg-indigo-50/50 border-dashed border-slate-300 hover:border-indigo-400 group shadow-xs'
            }`}
          >
            <AnimatePresence mode="wait">
              {!isRevealed ? (
                /* Hidden Mask State */
                <motion.div
                  key="hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-6 flex flex-col items-center justify-center text-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="text-base font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                    タップして{swapSides ? '単語' : '意味'}を表示
                  </div>
                  <p className="text-xs text-slate-400">
                    または [スペースキー] / [Enter] を押してください
                  </p>
                </motion.div>
              ) : (
                /* Revealed Meaning State */
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" />
                      {swapSides ? '正解・単語' : '正解・意味'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleReveal();
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      隠す
                    </button>
                  </div>

                  <div className="text-center space-y-2 py-1">
                    <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
                      {hiddenAnswer}
                    </div>

                    {/* Reading on back if swapped */}
                    {swapSides && currentCard.reading && (
                      <div className="text-xs font-mono text-indigo-600">
                        /{currentCard.reading}/
                      </div>
                    )}
                  </div>

                  {/* Example sentence */}
                  {currentCard.example && (
                    <div className="bg-white/90 rounded-xl p-3 text-left border border-indigo-100 text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-800">
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
                    <div className="text-xs text-slate-600 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-left leading-relaxed">
                      📝 <strong>メモ:</strong> {currentCard.note}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 4 Evaluation SRS Buttons (Four Grade Options) */}
      <div className="space-y-2">
        <div className="text-center text-xs font-bold text-slate-500 mb-1">
          {isRevealed ? '定着度を4段階で評価して次へ進む:' : '意味を確認してから評価してください (数字キー 1〜4):'}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          {/* 1. Again */}
          <button
            id="btn-reveal-grade-again"
            onClick={() => handleGrade('again')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border-2 border-rose-200 text-rose-700 transition-all shadow-xs group hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <X className="w-4 h-4" />
              <span>まだ / 苦手</span>
            </div>
            <span className="text-[10px] text-rose-500 mt-0.5">キー: [1] (要復習)</span>
          </button>

          {/* 2. Hard */}
          <button
            id="btn-reveal-grade-hard"
            onClick={() => handleGrade('hard')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border-2 border-amber-200 text-amber-800 transition-all shadow-xs group hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <Clock className="w-4 h-4" />
              <span>難しかった</span>
            </div>
            <span className="text-[10px] text-amber-600 mt-0.5">キー: [2] (1日後)</span>
          </button>

          {/* 3. Good */}
          <button
            id="btn-reveal-grade-good"
            onClick={() => handleGrade('good')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border-2 border-blue-200 text-blue-800 transition-all shadow-xs group hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <Check className="w-4 h-4" />
              <span>覚えた</span>
            </div>
            <span className="text-[10px] text-blue-600 mt-0.5">キー: [3] (3日後)</span>
          </button>

          {/* 4. Easy */}
          <button
            id="btn-reveal-grade-easy"
            onClick={() => handleGrade('easy')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border-2 border-emerald-200 text-emerald-800 transition-all shadow-xs group hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <Sparkles className="w-4 h-4" />
              <span>完璧</span>
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5">キー: [4] (7日後)</span>
          </button>

        </div>

        {/* Footer Hint & Stats */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400 pt-1">
          <button
            onClick={() => setShowHint((p) => !p)}
            className="hover:text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showHint ? 'ヒントを隠す' : '例文ヒントを表示'}
          </button>
          <span>
            復習回数: {currentCard.reviewCount} 回 (正解率: {currentCard.reviewCount > 0 ? Math.round((currentCard.correctCount / currentCard.reviewCount) * 100) : 0}%)
          </span>
        </div>
      </div>

    </div>
  );
};
