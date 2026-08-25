import React, { useState, useMemo } from 'react';
import { 
  FolderPlus, 
  Layers, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  Upload, 
  Download, 
  Play,
  Flame,
  CheckCircle2,
  BookOpen,
  Globe,
  Clock,
  Calendar,
  AlertCircle,
  Award
} from 'lucide-react';
import { Deck, WordCard, LanguageCode, SUPPORTED_LANGUAGES } from '../types';
import { DeleteDeckModal } from './DeleteDeckModal';
import { getDeckStudyStatus } from '../utils/srs';

interface DeckManagerProps {
  decks: Deck[];
  activeDeckId: string;
  onSelectDeck: (id: string) => void;
  onCreateDeck: (title: string, description: string, category: string, color: string, language?: LanguageCode) => void;
  onUpdateDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string) => void;
  words: WordCard[];
  onOpenImport: () => void;
  onOpenExport?: (deckId: string) => void;
  onStartStudy: (deckId: string) => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  decks,
  activeDeckId,
  onSelectDeck,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck,
  words,
  onOpenImport,
  onOpenExport,
  onStartStudy,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [todayFilter, setTodayFilter] = useState<'all' | 'unstudied_today' | 'studied_today'>('all');
  
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('一般');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [color, setColor] = useState<string>('indigo');

  const COLOR_OPTIONS = [
    { id: 'indigo', label: 'インディゴ', bg: 'bg-indigo-600', border: 'border-indigo-600' },
    { id: 'emerald', label: 'エメラルド', bg: 'bg-emerald-600', border: 'border-emerald-600' },
    { id: 'amber', label: 'アンバー', bg: 'bg-amber-600', border: 'border-amber-600' },
    { id: 'rose', label: 'ローズ', bg: 'bg-rose-600', border: 'border-rose-600' },
    { id: 'sky', label: 'スカイブルー', bg: 'bg-sky-600', border: 'border-sky-600' },
    { id: 'purple', label: 'パープル', bg: 'bg-purple-600', border: 'border-purple-600' },
  ];

  // Calculate status for all decks
  const decksWithStatus = useMemo(() => {
    return decks.map((deck) => {
      const deckWords = words.filter((w) => w.deckId === deck.id);
      const status = getDeckStudyStatus(deck, deckWords);
      return {
        deck,
        deckWords,
        status,
      };
    });
  }, [decks, words]);

  const studiedTodayCount = useMemo(() => {
    return decksWithStatus.filter((d) => d.status.isStudiedToday).length;
  }, [decksWithStatus]);

  const unstudiedTodayCount = useMemo(() => {
    return decksWithStatus.filter((d) => !d.status.isStudiedToday).length;
  }, [decksWithStatus]);

  const filteredDecks = useMemo(() => {
    if (todayFilter === 'studied_today') {
      return decksWithStatus.filter((d) => d.status.isStudiedToday);
    }
    if (todayFilter === 'unstudied_today') {
      return decksWithStatus.filter((d) => !d.status.isStudiedToday);
    }
    return decksWithStatus;
  }, [decksWithStatus, todayFilter]);

  const handleStartCreate = () => {
    setTitle('');
    setDescription('');
    setCategory('一般');
    setLanguage('en');
    setColor('indigo');
    setIsCreating(true);
    setEditingDeckId(null);
  };

  const handleStartEdit = (deck: Deck) => {
    setTitle(deck.title);
    setDescription(deck.description);
    setCategory(deck.category || '一般');
    setLanguage(deck.language || 'en');
    setColor(deck.color || 'indigo');
    setEditingDeckId(deck.id);
    setIsCreating(false);
  };

  const handleSaveDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isCreating) {
      onCreateDeck(title.trim(), description.trim(), category.trim(), color, language);
      setIsCreating(false);
    } else if (editingDeckId) {
      const existing = decks.find((d) => d.id === editingDeckId);
      if (existing) {
        onUpdateDeck({
          ...existing,
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          language,
          color,
          updatedAt: Date.now(),
        });
      }
      setEditingDeckId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>単語帳（フォルダ）管理</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              全 {decks.length} 冊
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            英語・ドイツ語・フランス語などの言語やジャンルごとに単語帳を作成し、一括インポートで効率よく単語を追加できます
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-deck-import"
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>一括インポート</span>
          </button>
          
          <button
            id="btn-create-deck-modal"
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>新規単語帳作成</span>
          </button>
        </div>
      </div>

      {/* Today's Study Status Summary & Filter Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>今日の学習達成状況</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>{studiedTodayCount} / {decks.length} 冊 完了</span>
            {studiedTodayCount === decks.length && decks.length > 0 ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                本日全単語帳コンプリート！
              </span>
            ) : unstudiedTodayCount > 0 ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                残り {unstudiedTodayCount} 冊未学習
              </span>
            ) : null}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80">
          <button
            id="filter-deck-all"
            onClick={() => setTodayFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              todayFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            すべて ({decks.length})
          </button>
          <button
            id="filter-deck-unstudied"
            onClick={() => setTodayFilter('unstudied_today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              todayFilter === 'unstudied_today'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>今日まだ ({unstudiedTodayCount})</span>
          </button>
          <button
            id="filter-deck-studied"
            onClick={() => setTodayFilter('studied_today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              todayFilter === 'studied_today'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                : 'text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>今日やった ({studiedTodayCount})</span>
          </button>
        </div>
      </div>

      {/* Create / Edit Form Banner */}
      {(isCreating || editingDeckId) && (
        <form 
          onSubmit={handleSaveDeck} 
          className="bg-white rounded-2xl border-2 border-indigo-200 p-5 shadow-md space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-indigo-600" />
              {isCreating ? '新規単語帳の作成' : '単語帳の編集'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingDeckId(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              キャンセル
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">単語帳タイトル *</label>
              <input
                type="text"
                required
                placeholder="例: ドイツ語 A1重要単語、フランス語 日常会話、TOEIC 900"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">対象言語 (音声・発音用)</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {Object.values(SUPPORTED_LANGUAGES).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">カテゴリ / ジャンル</label>
              <input
                type="text"
                placeholder="例: 英語、ドイツ語、フランス語、IT資格、大学受験"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">説明・メモ</label>
              <input
                type="text"
                placeholder="例: 頻出動詞とイディオムのセット"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Color theme options */}
          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-2">テーマカラー</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-all cursor-pointer ${
                    color === c.id ? 'ring-3 ring-indigo-300 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {editingDeckId ? (
              <button
                type="button"
                onClick={() => {
                  const target = decks.find((d) => d.id === editingDeckId);
                  if (target) {
                    setDeckToDelete(target);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                title="この単語帳を消去"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>単語帳を消去</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingDeckId(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                保存する
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-700">
            {todayFilter === 'studied_today' ? '今日学習した単語帳はまだありません' : '今日まだやっていない単語帳はありません'}
          </div>
          <p className="text-xs text-slate-400">
            {todayFilter === 'studied_today' 
              ? '「今日まだ」の単語帳から学習をスタートしましょう！' 
              : '素晴らしい！すべての単語帳で今日の復習が完了しています。'}
          </p>
          <button
            onClick={() => setTodayFilter('all')}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            すべての単語帳を表示
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map(({ deck, deckWords, status }) => {
            const { 
              totalCount, 
              unlearnedCount, 
              learningCount, 
              masteredCount, 
              masteredPercentage,
              isStudiedToday,
              studiedTodayCount: wordsReviewedToday,
              dueCount,
              allMastered,
              lastStudiedLabel
            } = status;
            
            const isActive = deck.id === activeDeckId;
            const langInfo = SUPPORTED_LANGUAGES[deck.language || 'en'] || SUPPORTED_LANGUAGES.en;

            return (
              <div
                key={deck.id}
                className={`bg-white rounded-3xl border-2 transition-all p-5 shadow-sm flex flex-col justify-between relative group ${
                  isActive
                    ? 'border-indigo-500 ring-2 ring-indigo-400/20 shadow-md'
                    : isStudiedToday
                    ? 'border-emerald-200 hover:border-emerald-300 bg-gradient-to-b from-emerald-50/20 to-white'
                    : 'border-amber-200/80 hover:border-amber-300 bg-gradient-to-b from-amber-50/15 to-white'
                }`}
              >
                <div>
                  {/* Top Status & Language Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {langInfo.flag} {langInfo.shortLabel}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {deck.category || '単語帳'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {onOpenExport && (
                        <button
                          onClick={() => onOpenExport(deck.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                          title="定着度別コピー・エクスポート"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(deck)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                        title="単語帳を編集"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-deck-${deck.id}`}
                        onClick={() => setDeckToDelete(deck)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="単語帳（フォルダ）を消去"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* PROMINENT TODAY STATUS BADGE */}
                  <div className="mb-3">
                    {allMastered ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>🏆 全単語 完璧達成 (100%)</span>
                      </div>
                    ) : isStudiedToday ? (
                      <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✅ 今日学習済み</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          今日 {wordsReviewedToday} 語復習
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>⏳ 今日まだやってない</span>
                        </div>
                        <span className="text-[11px] text-amber-700 font-semibold">
                          {dueCount > 0 ? `要復習 ${dueCount} 語` : `${unlearnedCount} 語未学習`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-3">
                    {deck.description || '説明なし'}
                  </p>

                  {/* Last Studied Timestamp Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>最終学習: <strong className="text-slate-600 font-medium">{lastStudiedLabel}</strong></span>
                    </span>
                    {dueCount > 0 && !allMastered && (
                      <span className="text-indigo-600 font-semibold">
                        今日復習目安: {dueCount}語
                      </span>
                    )}
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">習得率: {masteredPercentage}%</span>
                      <span className="text-slate-400 font-mono">{masteredCount} / {totalCount} 語</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(masteredCount / (totalCount || 1)) * 100}%` }} title={`習得済: ${masteredCount}`} />
                      <div className="bg-amber-400 h-full transition-all" style={{ width: `${(learningCount / (totalCount || 1)) * 100}%` }} title={`学習中: ${learningCount}`} />
                      <div className="bg-slate-200 h-full transition-all" style={{ width: `${(unlearnedCount / (totalCount || 1)) * 100}%` }} title={`未学習: ${unlearnedCount}`} />
                    </div>
                  </div>

                  {/* Mini Stats Breakdown */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] mb-4">
                    <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-100">
                      <div className="font-bold text-slate-700">{unlearnedCount}</div>
                      <div className="text-[10px] text-slate-400">未学習</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-1.5 border border-amber-100">
                      <div className="font-bold text-amber-700">{learningCount}</div>
                      <div className="text-[10px] text-amber-600">学習中</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-1.5 border border-emerald-100">
                      <div className="font-bold text-emerald-700">{masteredCount}</div>
                      <div className="text-[10px] text-emerald-600">習得済</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onSelectDeck(deck.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isActive ? '選択中' : '選択する'}
                  </button>

                  {totalCount > 0 && (
                    <button
                      onClick={() => {
                        onSelectDeck(deck.id);
                        onStartStudy(deck.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer transition-all ${
                        isStudiedToday
                          ? 'bg-slate-800 hover:bg-slate-900'
                          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-500/20'
                      }`}
                      title={isStudiedToday ? 'もう一度学習する' : '今日暗記を始める'}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isStudiedToday ? '再復習' : '今日やる'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Deck Modal */}
      <DeleteDeckModal
        isOpen={deckToDelete !== null}
        deck={deckToDelete}
        words={words}
        isOnlyDeck={decks.length <= 1}
        onClose={() => setDeckToDelete(null)}
        onConfirmDelete={(id) => {
          onDeleteDeck(id);
          if (editingDeckId === id) {
            setEditingDeckId(null);
            setIsCreating(false);
          }
        }}
      />
    </div>
  );
};
