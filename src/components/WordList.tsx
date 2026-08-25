import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Volume2, 
  Trash2, 
  Edit3, 
  Plus, 
  RotateCcw, 
  CheckSquare, 
  Square,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Upload,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Check,
  ListOrdered,
  Copy,
  ClipboardCheck,
  Download,
  AlertTriangle,
  X
} from 'lucide-react';
import { WordCard, FilterType, MasteryLevel, Deck, SUPPORTED_LANGUAGES, WordGender } from '../types';
import { MASTERY_LABELS } from '../utils/srs';
import { speakWord, sounds } from '../utils/sound';
import { exportCards } from '../utils/importExport';
import { DeleteDeckModal } from './DeleteDeckModal';
import { getCardGender, GENDER_CONFIGS } from '../utils/gender';

interface WordListProps {
  words: WordCard[];
  activeDeck: Deck;
  decksCount?: number;
  onEditWord: (word: WordCard) => void;
  onDeleteWord: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkResetProgress: (ids: string[]) => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddWord: () => void;
  onOpenImport: () => void;
  onOpenExport?: () => void;
  onDeleteDeck?: (id: string) => void;
  onUpdateCardMastery?: (card: WordCard, newLevel: MasteryLevel) => void;
  onStartMemorizeSheet?: () => void;
}

export const WordList: React.FC<WordListProps> = ({
  words,
  activeDeck,
  decksCount = 1,
  onEditWord,
  onDeleteWord,
  onBulkDelete,
  onBulkResetProgress,
  onToggleFavorite,
  onOpenAddWord,
  onOpenImport,
  onOpenExport,
  onDeleteDeck,
  onUpdateCardMastery,
  onStartMemorizeSheet,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | WordGender>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'default' | 'word' | 'mastery' | 'weak'>('default');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [isDeleteDeckModalOpen, setIsDeleteDeckModalOpen] = useState<boolean>(false);
  const [bulkActionTarget, setBulkActionTarget] = useState<'delete' | 'reset' | null>(null);
  
  // Memorize / Red Sheet mode within list
  const [isMemorizeMaskActive, setIsMemorizeMaskActive] = useState<boolean>(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const langInfo = SUPPORTED_LANGUAGES[activeDeck.language || 'en'] || SUPPORTED_LANGUAGES.en;

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => {
      setCopyToast(null);
    }, 3000);
  };

  const deckWords = useMemo(() => {
    return words.filter((w) => w.deckId === activeDeck.id);
  }, [words, activeDeck.id]);

  // Counts by mastery level
  const masteryCounts = useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    deckWords.forEach((w) => {
      const lvl = w.masteryLevel >= 0 && w.masteryLevel <= 4 ? w.masteryLevel : 0;
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return counts;
  }, [deckWords]);

  // Quick Copy for specific mastery category
  const handleCopyCategory = (level: MasteryLevel, label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetCards = deckWords.filter((w) => w.masteryLevel === level);
    if (targetCards.length === 0) {
      showToast(`「${label}」の単語は現在0件です`);
      return;
    }
    const tsvContent = exportCards(targetCards, 'tsv', false);
    navigator.clipboard.writeText(tsvContent);
    sounds.playCorrect();
    showToast(`📋「${label}」の単語 ${targetCards.length}件をクリップボードにコピーしました！`);
  };

  // Copy selected cards
  const handleCopySelected = () => {
    if (selectedIds.size === 0) return;
    const targetCards = deckWords.filter((w) => selectedIds.has(w.id));
    const tsvContent = exportCards(targetCards, 'tsv', false);
    navigator.clipboard.writeText(tsvContent);
    sounds.playCorrect();
    showToast(`📋 選択した ${targetCards.length}件の単語をコピーしました！`);
  };

  // Filter words by deck, search query, and mastery filter
  const filteredWords = useMemo(() => {
    return deckWords.filter((card) => {
      // Search matching
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        card.word.toLowerCase().includes(query) ||
        card.meaning.toLowerCase().includes(query) ||
        (card.reading && card.reading.toLowerCase().includes(query)) ||
        (card.tags && card.tags.some((t) => t.toLowerCase().includes(query)));

      if (!matchSearch) return false;

      // Filter by gender if selected
      if (genderFilter !== 'all') {
        const cardGender = getCardGender(card);
        if (cardGender !== genderFilter) return false;
      }

      // Filter category
      switch (selectedFilter) {
        case 'level0':
        case 'unlearned':
          return card.masteryLevel === 0;
        case 'level1':
          return card.masteryLevel === 1;
        case 'level2':
          return card.masteryLevel === 2;
        case 'level3':
          return card.masteryLevel === 3;
        case 'level4':
          return card.masteryLevel === 4;
        case 'learning':
          return card.masteryLevel >= 1 && card.masteryLevel <= 2;
        case 'mastered':
          return card.masteryLevel >= 3;
        case 'favorite':
          return card.isFavorite;
        case 'weak':
          return card.incorrectCount > 0 || (card.masteryLevel === 1 && card.reviewCount >= 2);
        case 'all':
        default:
          return true;
      }
    }).sort((a, b) => {
      if (sortBy === 'word') return a.word.localeCompare(b.word);
      if (sortBy === 'mastery') return a.masteryLevel - b.masteryLevel;
      if (sortBy === 'weak') return (b.incorrectCount - b.correctCount) - (a.incorrectCount - a.correctCount);
      return b.createdAt - a.createdAt;
    });
  }, [deckWords, searchQuery, selectedFilter, genderFilter, sortBy]);

  // Bulk selection helpers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredWords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWords.map((w) => w.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleRevealMeaning = (id: string) => {
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

  const handleToggleMastered = (card: WordCard, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateCardMastery) return;
    const isCurrentlyMastered = card.masteryLevel === 4;
    const newLevel: MasteryLevel = isCurrentlyMastered ? 1 : 4;
    if (!isCurrentlyMastered) {
      sounds.playMastered();
    } else {
      sounds.playFlip();
    }
    onUpdateCardMastery(card, newLevel);
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkActionTarget('delete');
  };

  const handleExecuteBulkReset = () => {
    if (selectedIds.size === 0) return;
    setBulkActionTarget('reset');
  };

  const handleConfirmBulkAction = () => {
    if (bulkActionTarget === 'delete') {
      onBulkDelete(Array.from(selectedIds));
      showToast(`${selectedIds.size} 件の単語を削除しました`);
      setSelectedIds(new Set());
    } else if (bulkActionTarget === 'reset') {
      onBulkResetProgress(Array.from(selectedIds));
      showToast(`${selectedIds.size} 件の進捗をリセットしました`);
      setSelectedIds(new Set());
    }
    setBulkActionTarget(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">{langInfo.flag}</span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{activeDeck.title}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 whitespace-nowrap">
              全 {deckWords.length} 語
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{activeDeck.description}</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {onOpenExport && (
            <button
              id="btn-list-export-by-mastery"
              onClick={onOpenExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-all cursor-pointer shadow-2xs"
              title="未学習・覚えたて・定着中・習得済・完璧を個別にコピー・出力"
            >
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
              <span>定着度別にコピー</span>
            </button>
          )}

          {onStartMemorizeSheet && (
            <button
              onClick={onStartMemorizeSheet}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors shadow-2xs cursor-pointer"
              title="暗記シート（日本語隠し・タップ表示モード）を開始"
            >
              <ListOrdered className="w-4 h-4 text-rose-600" />
              <span>暗記シートを開く</span>
            </button>
          )}

          <button
            id="btn-list-import"
            onClick={onOpenImport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>一括インポート</span>
          </button>
          <button
            id="btn-list-add-single"
            onClick={onOpenAddWord}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>単語追加</span>
          </button>

          {onDeleteDeck && (
            <button
              id="btn-list-delete-current-deck"
              onClick={() => setIsDeleteDeckModalOpen(true)}
              className="p-2.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
              title="この単語帳（フォルダ）を消去"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        
        {/* Search & Actions Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-words"
              type="text"
              placeholder="単語、意味、発音、タグで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                クリア
              </button>
            )}
          </div>

          {/* Memorize Mask Mode Toggle Button */}
          <button
            onClick={() => {
              setIsMemorizeMaskActive((p) => !p);
              setRevealedIds(new Set());
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
              isMemorizeMaskActive
                ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="日本語を赤シートのように隠して暗記チェック"
          >
            {isMemorizeMaskActive ? <EyeOff className="w-3.5 h-3.5 text-rose-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isMemorizeMaskActive ? '暗記中 (日本語隠し)' : '日本語を隠す (赤シート)'}</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <option value="default">新しい順</option>
              <option value="word">単語順 (A-Z)</option>
              <option value="mastery">定着度順 (低→高)</option>
              <option value="weak">苦手順 (間違い多)</option>
            </select>
          </div>
        </div>

        {/* 5-Mastery Quick Copy & Filter Bar */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-0.5">
            <span>定着度別の個別コピー＆絞り込み:</span>
            {onOpenExport && (
              <button 
                onClick={onOpenExport}
                className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>エクスポート設定を開く</span>
                <span>→</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {[
              { level: 0 as MasteryLevel, filterKey: 'level0' as FilterType, label: '未学習', sub: 'New' },
              { level: 1 as MasteryLevel, filterKey: 'level1' as FilterType, label: '覚えたて', sub: 'Box 1' },
              { level: 2 as MasteryLevel, filterKey: 'level2' as FilterType, label: '定着中', sub: 'Box 2' },
              { level: 3 as MasteryLevel, filterKey: 'level3' as FilterType, label: '習得済', sub: 'Box 3' },
              { level: 4 as MasteryLevel, filterKey: 'level4' as FilterType, label: '完璧', sub: 'Mastered' },
            ].map(({ level, filterKey, label, sub }) => {
              const info = MASTERY_LABELS[level];
              const count = masteryCounts[level] || 0;
              const isSelected = selectedFilter === filterKey;

              return (
                <div
                  key={level}
                  onClick={() => setSelectedFilter(isSelected ? 'all' : filterKey)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                  title={`クリックで「${label}」のみ表示、右側の📋ボタンでコピー`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${level === 4 ? 'bg-emerald-500' : level === 3 ? 'bg-indigo-500' : level === 2 ? 'bg-blue-500' : level === 1 ? 'bg-amber-500' : 'bg-slate-400'}`} />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 leading-none truncate">
                        {label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {count} 語
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Copy Button for this specific mastery category */}
                  <button
                    type="button"
                    disabled={count === 0}
                    onClick={(e) => handleCopyCategory(level, label, e)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ml-1"
                    title={`「${label}」の単語 (${count}語) をクリップボードにコピー`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* General Filter Pills & Gender Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs font-semibold no-scrollbar">
            {[
              { id: 'all', label: 'すべて表示' },
              { id: 'weak', label: '苦手・要復習' },
              { id: 'favorite', label: '⭐ お気に入り' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as FilterType)}
                className={`px-3 py-1.2 rounded-xl transition-all whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex items-center gap-1 text-[11px] font-bold bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 px-1 font-semibold hidden sm:inline">性別:</span>
            {[
              { id: 'all' as const, label: '全性別', badge: '' },
              { id: 'masculine' as const, label: '♂ 男性', badge: 'text-sky-700 bg-sky-50 border-sky-300' },
              { id: 'feminine' as const, label: '♀ 女性', badge: 'text-rose-700 bg-rose-50 border-rose-300' },
              { id: 'neuter' as const, label: '⚪ 中性', badge: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGenderFilter(g.id)}
                className={`px-2 py-0.5 rounded-lg transition-all text-[11px] font-bold cursor-pointer ${
                  genderFilter === g.id
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150 sticky top-2 z-20 shadow-md flex-wrap">
          <div className="flex items-center gap-2 font-bold text-indigo-900">
            <span>{selectedIds.size} 件を選択中</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopySelected}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 font-bold transition-all shadow-xs cursor-pointer"
              title="選択中の単語をクリップボードにコピー"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>選択単語をコピー</span>
            </button>
            <button
              onClick={handleExecuteBulkReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>進捗リセット</span>
            </button>
            <button
              onClick={handleExecuteBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>削除</span>
            </button>
          </div>
        </div>
      )}

      {/* Words Table / List */}
      {filteredWords.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">一致する単語が見つかりません</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              一括インポート機能を使って、ExcelやCSV、テキストから手軽に単語をインポートしてみましょう。
            </p>
          </div>
          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>単語を一括インポートする</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          
          {/* Mobile Card List (shown on sm:hidden) */}
          <div className="grid grid-cols-1 gap-2.5 sm:hidden">
            {filteredWords.map((card) => {
              const masteryInfo = MASTERY_LABELS[card.masteryLevel];
              const isSelected = selectedIds.has(card.id);
              const cardLang = card.language || activeDeck.language || 'en';
              const isMastered = card.masteryLevel === 4;
              const isRevealed = revealedIds.has(card.id);
              const cardGender = getCardGender(card);
              const genderConfig = GENDER_CONFIGS[cardGender];

              return (
                <div
                  key={card.id}
                  className={`rounded-2xl p-3.5 border transition-all shadow-xs ${
                    isMastered
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isSelected 
                        ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-400' 
                        : cardGender !== 'none'
                          ? `${genderConfig.cardBgClass} ${genderConfig.cardBorderClass}`
                          : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      
                      {/* Select Checkbox on the left */}
                      <button
                        onClick={() => toggleSelect(card.id)}
                        className="text-slate-400 hover:text-indigo-600 mt-1 shrink-0"
                        title="選択"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{card.word}</span>
                          {cardGender !== 'none' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${genderConfig.badgeClass}`}>
                              {genderConfig.symbol} {genderConfig.shortLabel}
                            </span>
                          )}
                          <button
                            onClick={() => speakWord(card.word, cardLang)}
                            className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50"
                            title="発音を聞く (多言語TTS)"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          {card.reading && (
                            <span className="text-[11px] font-mono text-indigo-600">/{card.reading}/</span>
                          )}
                        </div>

                        {/* Meaning with mask support */}
                        <div className="mt-1">
                          {isMemorizeMaskActive && !isRevealed ? (
                            <button
                              type="button"
                              onClick={() => toggleRevealMeaning(card.id)}
                              className="w-full text-left px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-dashed border-rose-300 text-rose-700 text-xs font-bold flex items-center justify-between transition-colors"
                            >
                              <span className="flex items-center gap-1">
                                <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                                <span>タップして日本語を表示</span>
                              </span>
                            </button>
                          ) : (
                            <div 
                              onClick={() => isMemorizeMaskActive && toggleRevealMeaning(card.id)}
                              className={`text-xs font-semibold text-slate-800 ${isMemorizeMaskActive ? 'cursor-pointer p-1 rounded hover:bg-slate-50' : ''}`}
                            >
                              {card.meaning}
                            </div>
                          )}
                        </div>

                        {card.example && (
                          <div className="text-[11px] text-slate-500 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            {card.example}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${masteryInfo.bg} ${masteryInfo.color} border ${masteryInfo.border}`}>
                            {masteryInfo.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            正解: {card.correctCount}/{card.reviewCount}
                          </span>
                          {card.tags?.map((t, idx) => (
                            <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right side: 完璧 Checkbox + Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {onUpdateCardMastery && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleMastered(card, e)}
                          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all text-xs font-bold ${
                            isMastered
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                              : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700'
                          }`}
                          title={isMastered ? '完璧（クリックで解除）' : '完璧に覚えた！（クリックで完璧に分類）'}
                        >
                          {isMastered ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{isMastered ? '完璧' : '覚えた'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onToggleFavorite(card.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          card.isFavorite ? 'text-amber-500' : 'text-slate-300'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${card.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => onEditWord(card)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`「${card.word}」を削除しますか？`)) {
                            onDeleteWord(card.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (hidden on sm, visible on desktop) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-700">
                        {selectedIds.size === filteredWords.length && filteredWords.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-2 w-8 text-center">⭐</th>
                    <th className="py-3 px-4">単語 (表面)</th>
                    <th className="py-3 px-4">意味 (裏面 / 日本語)</th>
                    <th className="py-3 px-4">発音・例文</th>
                    <th className="py-3 px-4 text-center">定着度</th>
                    <th className="py-3 px-3 text-center" title="完璧チェック">完璧チェック</th>
                    <th className="py-3 px-4 text-center">正解 / 復習</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWords.map((card) => {
                    const masteryInfo = MASTERY_LABELS[card.masteryLevel];
                    const isSelected = selectedIds.has(card.id);
                    const cardLang = card.language || activeDeck.language || 'en';
                    const isMastered = card.masteryLevel === 4;
                    const isRevealed = revealedIds.has(card.id);
                    const cardGender = getCardGender(card);
                    const genderConfig = GENDER_CONFIGS[cardGender];

                    return (
                      <tr 
                        key={card.id} 
                        className={`transition-colors ${
                          isMastered 
                            ? 'bg-emerald-50/20' 
                            : isSelected 
                              ? 'bg-indigo-50/30' 
                              : cardGender !== 'none'
                                ? `${genderConfig.rowHoverBg}`
                                : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Select Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleSelect(card.id)}
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Favorite Star */}
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => onToggleFavorite(card.id)}
                            className={`p-1 rounded transition-colors ${
                              card.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${card.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                        </td>

                        {/* Word */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{card.word}</span>
                            {cardGender !== 'none' && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${genderConfig.badgeClass}`}>
                                {genderConfig.symbol} {genderConfig.shortLabel}
                              </span>
                            )}
                            <button
                              onClick={() => speakWord(card.word, cardLang)}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="発音を聞く (多言語TTS)"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Meaning (with Red Sheet mask option) */}
                        <td className="py-3 px-4 min-w-[180px]">
                          {isMemorizeMaskActive && !isRevealed ? (
                            <button
                              type="button"
                              onClick={() => toggleRevealMeaning(card.id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-dashed border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                              <span>タップして日本語を表示</span>
                            </button>
                          ) : (
                            <div
                              onClick={() => isMemorizeMaskActive && toggleRevealMeaning(card.id)}
                              className={`${isMemorizeMaskActive ? 'cursor-pointer p-1 rounded hover:bg-slate-100 inline-block' : ''}`}
                            >
                              <div className="font-medium text-slate-800">{card.meaning}</div>
                              {card.tags && card.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {card.tags.map((t, idx) => (
                                    <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Reading / Example */}
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {card.reading && (
                            <div className="font-mono text-[11px] text-indigo-600">/{card.reading}/</div>
                          )}
                          {card.example && (
                            <div className="text-[11px] truncate text-slate-600" title={card.example}>
                              {card.example}
                            </div>
                          )}
                        </td>

                        {/* Mastery Level Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${masteryInfo.bg} ${masteryInfo.color} border ${masteryInfo.border}`}>
                            {masteryInfo.label}
                          </span>
                        </td>

                        {/* Mastered / 完璧 Checkbox on the right */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {onUpdateCardMastery && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleMastered(card, e)}
                              className={`px-3 py-1.5 rounded-xl border transition-all inline-flex items-center gap-1.5 font-bold ${
                                isMastered
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-700'
                              }`}
                              title={isMastered ? '完璧（クリックで解除）' : '完璧に覚えた！（クリックで完璧に分類）'}
                            >
                              {isMastered ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>{isMastered ? '完璧' : '覚えた'}</span>
                            </button>
                          )}
                        </td>

                        {/* Review Stats */}
                        <td className="py-3 px-4 text-center font-mono text-slate-600 whitespace-nowrap">
                          {card.correctCount} / {card.reviewCount}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditWord(card)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="編集"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteWord(card.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="単語を削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkActionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                bulkActionTarget === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {bulkActionTarget === 'delete' ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {bulkActionTarget === 'delete' ? '一括削除の確認' : '進捗リセットの確認'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  選択中: {selectedIds.size} 件の単語
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {bulkActionTarget === 'delete'
                ? `選択した ${selectedIds.size} 件の単語を単語帳から完全に削除します。よろしいですか？`
                : `選択した ${selectedIds.size} 件の単語の学習進捗・定着度を「未学習」にリセットします。よろしいですか？`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkActionTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkAction}
                className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-xs transition-all cursor-pointer ${
                  bulkActionTarget === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {bulkActionTarget === 'delete' ? '一括削除する' : 'リセットする'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Deck Modal */}
      {onDeleteDeck && (
        <DeleteDeckModal
          isOpen={isDeleteDeckModalOpen}
          deck={activeDeck}
          words={words}
          isOnlyDeck={decksCount <= 1}
          onClose={() => setIsDeleteDeckModalOpen(false)}
          onConfirmDelete={(id) => {
            onDeleteDeck(id);
            setIsDeleteDeckModalOpen(false);
          }}
        />
      )}

    </div>
  );
};
