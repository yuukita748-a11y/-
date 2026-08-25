import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  FastForward, 
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
  Brain
} from 'lucide-react';
import { WordCard } from '../types';
import { speakWord, stopSpeech } from '../utils/sound';
import { AppSettings } from '../utils/storage';

interface SpeedReviewProps {
  cards: WordCard[];
  onFinishSession: () => void;
  settings: AppSettings;
}

export const SpeedReview: React.FC<SpeedReviewProps> = ({
  cards,
  onFinishSession,
  settings,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  
  // Total card duration (default 2.5s)
  const [speedInterval, setSpeedInterval] = useState<number>(2.5);
  // Delay before revealing Japanese meaning (default 1.0s)
  const [meaningDelay, setMeaningDelay] = useState<number>(1.0);
  
  const [isMeaningVisible, setIsMeaningVisible] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(settings.autoAudio ?? true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentCard = cards[currentIndex];
  
  const nextCardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revealMeaningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (nextCardTimerRef.current) clearTimeout(nextCardTimerRef.current);
    if (revealMeaningTimerRef.current) clearTimeout(revealMeaningTimerRef.current);
  };

  const moveToNext = useCallback(() => {
    clearAllTimers();
    setCurrentIndex((prev) => {
      if (prev >= cards.length - 1) {
        setIsPlaying(false);
        setIsCompleted(true);
        setIsMeaningVisible(true);
        return prev;
      }
      return prev + 1;
    });
  }, [cards.length]);

  const moveToPrev = useCallback(() => {
    clearAllTimers();
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setIsCompleted(false);
  }, []);

  const handleRestart = () => {
    clearAllTimers();
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsMeaningVisible(false);
    setIsPlaying(true);
  };

  const handleManualReveal = () => {
    setIsMeaningVisible(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      clearAllTimers();
    };
  }, []);

  // Main playback & staggered reveal timer logic
  useEffect(() => {
    clearAllTimers();

    if (!currentCard || isCompleted) return;

    if (!isPlaying) {
      // When paused, show meaning for comfortable reading
      setIsMeaningVisible(true);
      return;
    }

    // 1. Initially hide meaning if delay > 0
    if (meaningDelay > 0) {
      setIsMeaningVisible(false);
      
      // Schedule staggered reveal of Japanese meaning
      revealMeaningTimerRef.current = setTimeout(() => {
        setIsMeaningVisible(true);
      }, meaningDelay * 1000);
    } else {
      setIsMeaningVisible(true);
    }

    // 2. Pronounce word at start
    if (voiceEnabled && currentCard.word) {
      speakWord(currentCard.word, currentCard.language || 'en');
    }

    // 3. Schedule next card transition
    const totalDuration = Math.max(speedInterval, meaningDelay + 0.5);
    nextCardTimerRef.current = setTimeout(() => {
      moveToNext();
    }, totalDuration * 1000);

    return () => {
      clearAllTimers();
    };
  }, [currentIndex, isPlaying, isCompleted, speedInterval, meaningDelay, voiceEnabled, currentCard, moveToNext]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        moveToNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        moveToPrev();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        handleManualReveal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveToNext, moveToPrev]);

  if (cards.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-3">
        <p className="text-slate-600 font-semibold">表示する単語がありません</p>
        <button
          onClick={onFinishSession}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          戻る
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      
      {/* Top Header Status */}
      <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600 px-1 gap-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-medium">1枚 {speedInterval}秒</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>日本語表示: {meaningDelay === 0 ? '即時' : `${meaningDelay}秒後`}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-300" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Speed Card Frame */}
      <div 
        onClick={handleManualReveal}
        className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-10 text-center shadow-xl space-y-6 min-h-[360px] flex flex-col justify-between items-center relative overflow-hidden transition-all cursor-pointer select-none"
        title="クリックで日本語を即時表示"
      >
        
        {/* Top Badges */}
        <div className="w-full flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            高速自動送り (想起トレーニング)
          </span>

          {isCompleted ? (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              完了
            </div>
          ) : isPlaying ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              自動送り中
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              一時停止中
            </div>
          )}
        </div>

        {/* Center: Word Content */}
        <div className="space-y-4 my-auto py-2 max-w-lg w-full">
          {/* Word Heading */}
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-sans">
            {currentCard?.word}
          </h2>

          {/* Phonetic / Reading */}
          {currentCard?.reading && (
            <div className="text-sm sm:text-base font-mono text-indigo-600">
              /{currentCard.reading}/
            </div>
          )}

          {/* Staggered Delayed Japanese Meaning */}
          <div className="min-h-[70px] flex items-center justify-center pt-3 border-t border-slate-100">
            {isMeaningVisible ? (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-xl sm:text-2xl font-bold text-slate-800">
                  {currentCard?.meaning}
                </div>
                {currentCard?.example && (
                  <div className="text-xs sm:text-sm text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100 max-w-md mx-auto">
                    💬 {currentCard.example}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 text-indigo-500/80 bg-indigo-50/60 border border-dashed border-indigo-200 py-2.5 px-4 rounded-2xl animate-pulse">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>意味を想起中... ({meaningDelay}秒後に表示)</span>
                </div>
                <div className="text-[10px] text-indigo-400">
                  タップで即時表示
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pronunciation & Hint */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => speakWord(currentCard.word, currentCard.language || 'en')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            title="発音を再再生"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>発音再生</span>
          </button>
        </div>

      </div>

      {/* Control Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-md space-y-4">
        
        {/* Primary Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Play / Pause / Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={moveToPrev}
              disabled={currentIndex === 0}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors cursor-pointer"
              title="前へ (←キー)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isCompleted ? (
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>最初からやり直す</span>
              </button>
            ) : (
              <button
                id="btn-speed-play-pause"
                onClick={() => setIsPlaying((p) => !p)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
                title="再生 / 一時停止 (スペースキー)"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? '一時停止' : '再生'}</span>
              </button>
            )}

            <button
              onClick={moveToNext}
              disabled={currentIndex >= cards.length - 1}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors cursor-pointer"
              title="次へ (→キー)"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          {/* Voice & Finish */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (voiceEnabled) stopSpeech();
                setVoiceEnabled((p) => !p);
              }}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                voiceEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={voiceEnabled ? '音声読み上げ: オン' : '音声読み上げ: オフ'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onFinishSession}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              学習完了
            </button>
          </div>

        </div>

        {/* Staggered Delay & Speed Settings Controls */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          {/* Japanese Meaning Delay Selector */}
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-indigo-600" />
              日本語の表示ズレ:
            </span>
            <div className="flex items-center gap-1">
              {[
                { label: '即時', val: 0 },
                { label: '0.6秒', val: 0.6 },
                { label: '1.0秒', val: 1.0 },
                { label: '1.5秒', val: 1.5 },
                { label: '2.0秒', val: 2.0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setMeaningDelay(opt.val)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    meaningDelay === opt.val
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card Speed Selector */}
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              1枚の表示時間:
            </span>
            <div className="flex items-center gap-1">
              {[1.5, 2.0, 2.5, 3.0, 4.0].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSpeedInterval(sec)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    speedInterval === sec
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {sec}秒
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
