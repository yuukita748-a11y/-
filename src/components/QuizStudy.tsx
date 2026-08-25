import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Volume2, 
  Clock, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles,
  Shuffle
} from 'lucide-react';
import { WordCard, MasteryLevel } from '../types';
import { calculateNextReview } from '../utils/srs';
import { speakWord, sounds } from '../utils/sound';
import { AppSettings } from '../utils/storage';

interface QuizStudyProps {
  cards: WordCard[];
  allDeckCards: WordCard[];
  onUpdateCard: (updatedCard: WordCard, isCorrect: boolean, prevLevel: MasteryLevel, newLevel: MasteryLevel) => void;
  onFinishSession: () => void;
  settings: AppSettings;
}

export const QuizStudy: React.FC<QuizStudyProps> = ({
  cards,
  allDeckCards,
  onUpdateCard,
  onFinishSession,
  settings,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(settings.quizTimer || 10);
  const [swapSides, setSwapSides] = useState<boolean>(settings.cardFrontSide === 'meaning');

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  const [options, setOptions] = useState<string[]>([]);

  // Generate 4 choice options (1 correct + 3 random distractors from deck or pool)
  useEffect(() => {
    if (!currentCard) {
      setOptions([]);
      return;
    }

    const correctAnswer = swapSides ? currentCard.word : currentCard.meaning;
    
    // Distractors pool
    const otherCards = allDeckCards.filter((c) => c.id !== currentCard.id);
    const pool = otherCards.map((c) => (swapSides ? c.word : c.meaning)).filter(Boolean);

    // Shuffle pool
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const distractors: string[] = [];
    for (const item of shuffledPool) {
      if (item !== correctAnswer && !distractors.includes(item)) {
        distractors.push(item);
      }
      if (distractors.length >= 3) break;
    }

    // If not enough distractors from current deck, fill generic or unique
    let dummyCount = 1;
    while (distractors.length < 3) {
      distractors.push(`選択肢 ${dummyCount++}`);
    }

    const allChoices = [correctAnswer, ...distractors];
    setOptions(allChoices.sort(() => 0.5 - Math.random()));
  }, [currentIndex, currentCard?.id, swapSides]);

  // Pronounce question
  useEffect(() => {
    if (currentCard && settings.autoAudio) {
      speakWord(swapSides ? currentCard.meaning : currentCard.word, currentCard.language || 'en');
    }
  }, [currentIndex, swapSides]);

  // Handle timeout when timeLeft reaches 0
  const handleSelectAnswer = useCallback(
    (choice: string) => {
      if (isAnswered || !currentCard) return;

      const correctAnswer = swapSides ? currentCard.word : currentCard.meaning;
      const isCorrect = choice === correctAnswer;

      setSelectedOption(choice);
      setIsAnswered(true);

      if (isCorrect) {
        if (settings.soundFx) sounds.playCorrect();
        setStreak((prev) => prev + 1);
      } else {
        if (settings.soundFx) sounds.playIncorrect();
        setStreak(0);
      }

      const prevLevel = currentCard.masteryLevel;
      const srsUpdate = calculateNextReview(currentCard, isCorrect ? 'good' : 'again');
      const updatedCard: WordCard = {
        ...currentCard,
        ...srsUpdate,
      };

      onUpdateCard(updatedCard, isCorrect, prevLevel, updatedCard.masteryLevel);
    },
    [isAnswered, currentCard, swapSides, settings.soundFx, onUpdateCard]
  );

  // Timer countdown
  useEffect(() => {
    if (isAnswered || isFinished || !settings.quizTimer || settings.quizTimer <= 0) return;

    setTimeLeft(settings.quizTimer);
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isAnswered, isFinished, settings.quizTimer]);

  // Trigger timeout outside of state updater
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered && !isFinished && settings.quizTimer > 0) {
      handleSelectAnswer('__TIMEOUT__');
    }
  }, [timeLeft, isAnswered, isFinished, settings.quizTimer, handleSelectAnswer]);

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex((prev) => prev + 1);
  };

  // Keyboard navigation (1, 2, 3, 4 for options, Enter / Space for Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (!isAnswered) {
        if (e.key === '1' && options[0]) handleSelectAnswer(options[0]);
        else if (e.key === '2' && options[1]) handleSelectAnswer(options[1]);
        else if (e.key === '3' && options[2]) handleSelectAnswer(options[2]);
        else if (e.key === '4' && options[3]) handleSelectAnswer(options[3]);
      } else {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, options, handleSelectAnswer]);

  if (!currentCard || isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-md">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">4択テスト完了！</h3>
        <p className="text-sm text-slate-500 mb-6">スコアと復習スケジュールが更新されました。</p>
        <button
          id="btn-finish-quiz"
          onClick={onFinishSession}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all hover:scale-105"
        >
          結果サマリーを見る
        </button>
      </div>
    );
  }

  const question = swapSides ? currentCard.meaning : currentCard.word;
  const correctAnswer = swapSides ? currentCard.word : currentCard.meaning;
  const progressPercent = Math.round((currentIndex / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Top Header info */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono">
            問 {currentIndex + 1} / {cards.length}
          </span>
          {streak > 1 && (
            <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streak} 連続正解!</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Timer display */}
          {settings.quizTimer > 0 && (
            <div className={`flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-lg border ${
              timeLeft <= 3 ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}

          <button
            onClick={() => speakWord(question, currentCard.language || 'en')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600"
            title="発音再生"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
        <div 
          className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 text-center shadow-lg space-y-3">
        <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          {swapSides ? 'この意味に該当する単語を選んでください' : 'この単語の正しい意味を選んでください'}
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
          {question}
        </h2>

        {!swapSides && currentCard.reading && settings.showPhonetic && (
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono text-xs border border-indigo-100">
            /{currentCard.reading}/
          </div>
        )}
      </div>

      {/* 4 Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrectChoice = option === correctAnswer;

          let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-indigo-50/60 hover:border-indigo-300';
          
          if (isAnswered) {
            if (isCorrectChoice) {
              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400 font-bold shadow-md';
            } else if (isSelected) {
              btnStyle = 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-300';
            } else {
              btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              id={`btn-quiz-option-${idx}`}
              disabled={isAnswered}
              onClick={() => handleSelectAnswer(option)}
              className={`p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all relative flex items-center justify-between group ${btnStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                  {idx + 1}
                </span>
                <span className="truncate">{option}</span>
              </div>

              {isAnswered && isCorrectChoice && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
              )}
              {isAnswered && isSelected && !isCorrectChoice && (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Explanation & Next Button */}
      {isAnswered && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedOption === correctAnswer ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>正解です！</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-700 font-bold text-sm">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>不正解（正解: {correctAnswer}）</span>
                </div>
              )}
            </div>

            <button
              id="btn-quiz-next"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <span>次の問題へ [Enter]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Example / Note details */}
          {(currentCard.example || currentCard.note) && (
            <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
              {currentCard.example && (
                <div className="italic">例文: {currentCard.example}</div>
              )}
              {currentCard.note && (
                <div className="text-slate-500 font-sans">解説: {currentCard.note}</div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
