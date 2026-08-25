import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles,
  RotateCcw,
  Eye,
  Keyboard
} from 'lucide-react';
import { WordCard, MasteryLevel } from '../types';
import { calculateNextReview } from '../utils/srs';
import { speakWord, sounds } from '../utils/sound';
import { AppSettings } from '../utils/storage';

interface TypingStudyProps {
  cards: WordCard[];
  onUpdateCard: (updatedCard: WordCard, isCorrect: boolean, prevLevel: MasteryLevel, newLevel: MasteryLevel) => void;
  onFinishSession: () => void;
  settings: AppSettings;
}

const SPECIAL_CHARS: Record<string, string[]> = {
  de: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
  fr: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ç', 'î', 'ô', 'ù', 'û', 'œ', 'É', 'Ç'],
  es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
  it: ['à', 'è', 'é', 'ì', 'ò', 'ù'],
};

export const TypingStudy: React.FC<TypingStudyProps> = ({
  cards,
  onUpdateCard,
  onFinishSession,
  settings,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [hintCount, setHintCount] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;
  const cardLang = currentCard?.language || 'en';
  const specialChars = SPECIAL_CHARS[cardLang] || [];

  useEffect(() => {
    setUserInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setHintCount(0);
    inputRef.current?.focus();

    if (currentCard && settings.autoAudio) {
      speakWord(currentCard.word, cardLang);
    }
  }, [currentIndex]);

  const insertChar = (char: string) => {
    setUserInput((prev) => prev + char);
    inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentCard || isAnswered) return;

    const trimmedInput = userInput.trim().toLowerCase();
    const targetWord = currentCard.word.trim().toLowerCase();
    const correct = trimmedInput === targetWord;

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      if (settings.soundFx) sounds.playCorrect();
    } else {
      if (settings.soundFx) sounds.playIncorrect();
    }

    const prevLevel = currentCard.masteryLevel;
    const srsUpdate = calculateNextReview(currentCard, correct ? 'good' : 'again');
    const updatedCard: WordCard = {
      ...currentCard,
      ...srsUpdate,
    };

    onUpdateCard(updatedCard, correct, prevLevel, updatedCard.masteryLevel);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleGiveHint = () => {
    if (!currentCard) return;
    setHintCount((prev) => Math.min(currentCard.word.length, prev + 1));
  };

  if (!currentCard || isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-6 sm:my-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-md">
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">タイピングテスト完了！</h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">スペルと記憶の定着が強化されました。</p>
        <button
          onClick={onFinishSession}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105"
        >
          結果サマリーを見る
        </button>
      </div>
    );
  }

  const targetWord = currentCard.word;
  const hintDisplay = targetWord
    .split('')
    .map((char, i) => (i < hintCount || char === ' ' ? char : '_'))
    .join(' ');

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono">
          問 {currentIndex + 1} / {cards.length}
        </span>
        <button
          onClick={() => speakWord(currentCard.word, cardLang)}
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 flex items-center gap-1 text-xs"
        >
          <Volume2 className="w-4 h-4" />
          <span>音声ヒント</span>
        </button>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-8 text-center shadow-lg space-y-3 sm:space-y-4">
        <div className="text-[11px] sm:text-xs text-slate-400 font-semibold tracking-wider uppercase">
          以下の意味に一致する単語を正確に入力してください
        </div>

        <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          {currentCard.meaning}
        </h2>

        {/* Hints / Letters */}
        <div className="pt-1 sm:pt-2">
          <div className="font-mono text-lg sm:text-xl tracking-widest text-indigo-700 font-bold bg-indigo-50/70 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl border border-indigo-100 inline-block">
            {hintDisplay}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            文字数: {targetWord.length} 文字
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            ref={inputRef}
            id="input-typing-word"
            type="text"
            disabled={isAnswered}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="ここにスペルを入力..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full text-center text-lg sm:text-xl font-bold py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl border-2 transition-all focus:outline-hidden ${
              isAnswered
                ? isCorrect
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                  : 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-300'
                : 'bg-white border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-slate-900'
            }`}
          />
        </div>

        {/* Special Character Quick Buttons (for German, French, etc.) */}
        {!isAnswered && specialChars.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap p-2 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Keyboard className="w-3 h-3" />
              特殊文字:
            </span>
            {specialChars.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => insertChar(ch)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-indigo-50 hover:border-indigo-300 active:bg-indigo-100 text-slate-800 font-bold text-sm flex items-center justify-center transition-all"
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        {!isAnswered ? (
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleGiveHint}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ヒント (+1文字)</span>
            </button>

            <button
              type="submit"
              disabled={!userInput.trim()}
              className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105"
            >
              <span>解答する</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>正解です！ ({targetWord})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-sm">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>正解: <strong className="font-mono text-base">{targetWord}</strong></span>
                  </div>
                )}
              </div>

              <button
                type="button"
                autoFocus
                onClick={handleNext}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <span>次の問題へ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </form>

    </div>
  );
};
