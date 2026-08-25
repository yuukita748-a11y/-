import React from 'react';
import { 
  Layers, 
  PlusCircle, 
  Upload, 
  Download, 
  BookOpen, 
  HelpCircle, 
  Flame, 
  Settings2,
  FolderOpen,
  RotateCcw
} from 'lucide-react';
import { Deck, WordCard } from '../types';
import { getDeckStudyStatus } from '../utils/srs';

interface NavbarProps {
  decks: Deck[];
  activeDeckId: string;
  onSelectDeck: (id: string) => void;
  words: WordCard[];
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenDeckManager: () => void;
  onOpenAddWord: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenReset: () => void;
  currentView: 'study' | 'deckManager' | 'wordList';
  onNavigate: (view: 'study' | 'deckManager' | 'wordList') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  decks,
  activeDeckId,
  onSelectDeck,
  words,
  onOpenImport,
  onOpenExport,
  onOpenDeckManager,
  onOpenAddWord,
  onOpenSettings,
  onOpenShortcuts,
  onOpenReset,
  currentView,
  onNavigate,
}) => {
  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];
  const deckWords = words.filter((w) => w.deckId === activeDeckId);
  const masteredCount = deckWords.filter((w) => w.masteryLevel >= 3).length;
  const masteryPercentage = deckWords.length > 0 ? Math.round((masteredCount / deckWords.length) * 100) : 0;
  const activeDeckStatus = activeDeck ? getDeckStudyStatus(activeDeck, deckWords) : null;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Deck Selector */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              id="btn-logo-home"
              onClick={() => onNavigate('study')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
                  暗記特化 単語帳
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Pro
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">Memory Master</div>
              </div>
            </button>

            {/* Deck Selector Dropdown & Quick Manage Button */}
            <div className="flex items-center gap-1 bg-slate-100/90 px-1.5 py-1 rounded-xl border border-slate-200 max-w-[240px] sm:max-w-xs">
              <span className="text-xs shrink-0 ml-1" title={activeDeckStatus?.isStudiedToday ? '今日学習済み' : '今日未学習'}>
                {activeDeckStatus?.isStudiedToday ? '✅' : '⏳'}
              </span>
              <select
                id="select-active-deck"
                value={activeDeckId}
                onChange={(e) => onSelectDeck(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden cursor-pointer truncate w-full py-0.5"
              >
                {decks.map((deck) => {
                  const dWords = words.filter((w) => w.deckId === deck.id);
                  const status = getDeckStudyStatus(deck, dWords);
                  const statusPrefix = status.allMastered ? '🏆' : status.isStudiedToday ? '✅[済]' : '⏳[未]';
                  return (
                    <option key={deck.id} value={deck.id}>
                      {statusPrefix} {deck.title} ({dWords.length}語)
                    </option>
                  );
                })}
              </select>
              <button
                id="btn-nav-manage-decks"
                onClick={() => onNavigate('deckManager')}
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200/80 transition-colors shrink-0 cursor-pointer"
                title="単語帳（フォルダ）の管理・追加・消去"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              id="nav-tab-study"
              onClick={() => onNavigate('study')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'study'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              暗記学習
            </button>
            <button
              id="nav-tab-words"
              onClick={() => onNavigate('wordList')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'wordList'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              単語一覧 ({deckWords.length})
            </button>
            <button
              id="nav-tab-decks"
              onClick={() => onNavigate('deckManager')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'deckManager'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              単語帳管理
            </button>
          </nav>

          {/* Action buttons & stats */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Mastery Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs font-medium">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>習得率: <strong>{masteryPercentage}%</strong></span>
              <div className="w-12 bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${masteryPercentage}%` }} 
                />
              </div>
            </div>

            {/* 一括インポートボタン */}
            <button
              id="btn-nav-import"
              onClick={onOpenImport}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-600/20 transition-all hover:scale-[1.02] shrink-0 whitespace-nowrap cursor-pointer"
              title="CSV・TSV・テキストから単語を一括登録"
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="font-bold hidden xs:inline">一括インポート</span>
              <span className="font-bold inline xs:hidden">インポート</span>
            </button>

            {/* 単語追加ボタン */}
            <button
              id="btn-nav-add-word"
              onClick={onOpenAddWord}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
              title="1件ずつ単語を追加"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline">単語追加</span>
            </button>

            {/* エクスポート / コピー */}
            <button
              id="btn-nav-export"
              onClick={onOpenExport}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200 shrink-0 cursor-pointer"
              title="定着度別コピー・エクスポート"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* ショートカット */}
            <button
              id="btn-nav-shortcuts"
              onClick={onOpenShortcuts}
              className="hidden sm:flex p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
              title="キーボードショートカット一覧"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* 設定 */}
            <button
              id="btn-nav-settings"
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
              title="設定"
            >
              <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* 初期化 / リセット */}
            <button
              id="btn-nav-reset"
              onClick={onOpenReset}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
              title="データ初期化 / リセット"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => onNavigate('study')}
            className={`px-3 py-1 rounded-lg ${currentView === 'study' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600'}`}
          >
            暗記学習
          </button>
          <button
            onClick={() => onNavigate('wordList')}
            className={`px-3 py-1 rounded-lg ${currentView === 'wordList' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600'}`}
          >
            単語一覧 ({deckWords.length})
          </button>
          <button
            onClick={() => onNavigate('deckManager')}
            className={`px-3 py-1 rounded-lg ${currentView === 'deckManager' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600'}`}
          >
            単語帳一覧
          </button>
        </div>
      </div>
    </header>
  );
};
