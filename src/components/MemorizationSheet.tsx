import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Circle, 
  Volume2, 
  Star, 
  Search, 
  Sparkles, 
  Check, 
  RotateCcw,
  BookOpen,
  Square,
  CheckSquare
} from 'lucide-react';
import { WordCard, MasteryLevel } from '../types';
import { speakWord, sounds } from '../utils/sound';
import { AppSettings } from '../utils/storage';

interface MemorizationSheetProps {
  cards: WordCard[];
  onUpdateCard: (
    updatedCard: WordCard,
    isCorrect: boolean,
    prevLevel: MasteryLevel,
    newLevel: MasteryLevel
  ) => void;
  onFinishSession: () => void;
  onToggleFavorite: (id: string) => void;
  settings: AppSettings;
}

export const MemorizationSheet: React.FC<MemorizationSheetProps> = ({
  cards: propCards,
  onUpdateCard,
  onFinishSession,
  onToggleFavorite,
  settings,
}) => {
  // Maintain local cards state for instant reactive UI updates
  const [cards, setCards] = useState<WordCard[]>(propCards);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'unmastered' | 'mastered' | 'favorite'>('all');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [maskTarget, setMaskTarget] = useState<'meaning' | 'word'>('meaning'); // default: hide Japanese meaning

  // Sync prop changes
  useEffect(() => {
    setCards(propCards);
  }, [propCards]);

  // Filter cards based on search and status
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        card.word.toLowerCase().includes(query) ||
        card.meaning.toLowerCase().includes(query) ||
        (card.reading && card.reading.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterMode === 'unmastered') return card.masteryLevel < 4;
      if (filterMode === 'mastered') return card.masteryLevel === 4;
      if (filterMode === 'favorite') return card.isFavorite;
      return true;
    });
  }, [cards, searchQuery, filterMode]);

  // Mastered counts
  const totalCards = cards.length;
  const masteredCount = cards.filter((c) => c.masteryLevel === 4).length;
  const masteredPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  // Toggle individual card mask
  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Reveal all or hide all
  const handleRevealAll = () => {
    setRevealedIds(new Set(filteredCards.map((c) => c.id)));
  };

  const handleHideAll = () => {
    setRevealedIds(new Set());
  };

  // Right-side Checkbox: toggle mastered (Level 4: 完璧)
  const handleToggleMastered = (card: WordCard, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const prevLevel = card.masteryLevel;
    const isCurrentlyMastered = prevLevel === 4;
    const newLevel: MasteryLevel = isCurrentlyMastered ? 1 : 4;

    if (!isCurrentlyMastered) {
      sounds.playMastered();
    } else {
      sounds.playFlip();
    }

    const updated: WordCard = {
      ...card,
      masteryLevel: newLevel,
      correctCount: isCurrentlyMastered ? Math.max(0, card.correctCount - 1) : card.correctCount + 1,
      reviewCount: card.reviewCount + 1,
      lastReviewedAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Instant local state update
    setCards((prev) => prev.map((w) => (w.id === card.id ? updated : w)));

    // Propagate to global state
    onUpdateCard(updated, !isCurrentlyMastered, prevLevel, newLevel);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Summary Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5" />
              単語一覧 暗記シート
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              日本語隠し＆完璧チェック暗記
            </h2>
            <p className="text-xs text-slate-500">
              赤シートで意味を隠して即座に想起テスト。右側のチェックボックスをタップして「完璧」に分類できます。
            </p>
          </div>

          {/* Mastered Counter Badge */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-right min-w-[160px]">
            <div className="text-[11px] font-bold text-slate-500">完璧に覚えた単語</div>
            <div className="text-2xl font-black text-emerald-600 font-mono flex items-center justify-end gap-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100" />
              <span>{masteredCount} <span className="text-xs font-normal text-slate-400">/ {totalCards} 語</span></span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>完全習得の進捗率</span>
            <span className="text-indigo-600 font-bold font-mono">{masteredPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${masteredPercent}%` }}
            />
          </div>
        </div>

        {/* Controls and Toolbar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Reveal / Hide All & Mask Target */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRevealAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              title="すべての隠しシートをめくる"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>すべて表示</span>
            </button>
            <button
              onClick={handleHideAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              title="すべて隠す（暗記モード）"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
              <span>すべて隠す</span>
            </button>

            {/* Mask target toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs ml-1">
              <button
                onClick={() => setMaskTarget('meaning')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  maskTarget === 'meaning'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                日本語を隠す
              </button>
              <button
                onClick={() => setMaskTarget('word')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  maskTarget === 'word'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                外国語を隠す
              </button>
            </div>
          </div>

          {/* Right: Filters & Finish */}
          <div className="flex items-center gap-2">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as typeof filterMode)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="all">全単語 ({totalCards})</option>
              <option value="unmastered">未完了のみ ({totalCards - masteredCount})</option>
              <option value="mastered">完璧のみ ({masteredCount})</option>
              <option value="favorite">⭐ お気に入り</option>
            </select>

            <button
              onClick={onFinishSession}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              学習完了
            </button>
          </div>

        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="単語・意味で絞り込み..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Word Memorization List Items */}
      <div className="space-y-2.5">
        {filteredCards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">該当する単語がありません</p>
          </div>
        ) : (
          filteredCards.map((card, index) => {
            const isMastered = card.masteryLevel === 4;
            const isRevealed = revealedIds.has(card.id);
            const isMaskingMeaning = maskTarget === 'meaning';

            return (
              <div
                key={card.id}
                onClick={() => toggleReveal(card.id)}
                className={`group bg-white rounded-2xl border transition-all p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none ${
                  isMastered
                    ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50/60 shadow-2xs'
                    : 'border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                }`}
              >
                {/* Left: Index Sequence Number */}
                <div className="shrink-0 flex items-center justify-center w-7 text-center">
                  <span className={`text-xs font-mono font-bold ${isMastered ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
                    {index + 1}
                  </span>
                </div>

                {/* Center: Word & Meaning Columns */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 items-center min-w-0">
                  
                  {/* Foreign Word Column */}
                  <div className="flex items-center gap-2 min-w-0">
                    {isMaskingMeaning || isRevealed ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight font-sans truncate">
                            {card.word}
                          </span>
                          {card.reading && (
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                              /{card.reading}/
                            </span>
                          )}
                        </div>
                        {card.example && isRevealed && (
                          <div className="text-[11px] text-slate-500 mt-0.5 italic truncate max-w-sm">
                            💬 {card.example}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Masked Word */
                      <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-100 to-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-2 shadow-xs">
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>タップして単語を表示</span>
                      </div>
                    )}

                    {/* Audio TTS Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(card.word, card.language || 'en');
                      }}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 ml-auto md:ml-0"
                      title="発音を再生 (多言語TTS)"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Japanese Meaning Column */}
                  <div className="min-w-0">
                    {!isMaskingMeaning || isRevealed ? (
                      <div className="space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="font-bold text-slate-900 text-sm sm:text-base">
                          {card.meaning}
                        </div>
                        {card.note && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                            📝 {card.note}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Red Sheet Blind Mask for Japanese Meaning */
                      <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500/10 via-rose-500/15 to-rose-500/10 border-2 border-dashed border-rose-300 text-rose-700 text-xs font-bold flex items-center justify-between hover:bg-rose-500/20 transition-all shadow-2xs">
                        <span className="flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                          <span>タップして日本語を表示</span>
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-semibold">
                          暗記中
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Side: Favorite + Prominent 完璧 Checkbox */}
                <div className="shrink-0 flex items-center gap-2 sm:gap-3">
                  
                  {/* Star Favorite Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(card.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      card.isFavorite
                        ? 'text-amber-500 fill-amber-500 bg-amber-50'
                        : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                    }`}
                    title="お気に入り"
                  >
                    <Star className={`w-4 h-4 ${card.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  {/* 完璧 (Mastered) Checkbox on the RIGHT side */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleMastered(card, e)}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                      isMastered
                        ? 'bg-emerald-600 border-emerald-600 text-white font-bold hover:bg-emerald-700 active:scale-95'
                        : 'bg-white hover:bg-emerald-50 border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 active:scale-95'
                    }`}
                    title={isMastered ? '完璧（クリックで未完了に戻す）' : '完璧に覚えた！（クリックで完璧に分類）'}
                  >
                    {isMastered ? (
                      <Check className="w-4 h-4 stroke-[3] text-white" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                    )}
                    <span className="text-xs font-bold">
                      {isMastered ? '完璧' : '覚えた'}
                    </span>
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Floating / Bottom Finish CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-md flex items-center justify-between gap-4 sticky bottom-4 z-20">
        <div className="text-xs font-semibold text-slate-600">
          完璧チェック: <strong className="text-emerald-600 font-mono">{masteredCount}</strong> / {totalCards} 語 ({masteredPercent}%)
        </div>
        <button
          onClick={onFinishSession}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          暗記シートを完了する
        </button>
      </div>

    </div>
  );
};
