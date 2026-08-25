import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  ArrowRight,
  List,
  Copy,
  Check,
  Volume2,
  Download,
  Share2,
  FileText,
  HelpCircle,
  FolderPlus,
  Home,
  Layers,
  ArrowLeft,
  X
} from 'lucide-react';
import { StudyResult, WordCard } from '../types';
import { MASTERY_LABELS } from '../utils/srs';
import { exportCards } from '../utils/importExport';
import { speakWord } from '../utils/sound';

interface StudySummaryProps {
  result: StudyResult;
  onRestartSession: () => void;
  onStartWeakSession: (weakCards: WordCard[]) => void;
  onGoToWordList: () => void;
  onGoHome: () => void;
  onGoToDeckManager?: () => void;
  onCreateDeckFromWeak?: (weakCards: WordCard[]) => void;
}

export const StudySummary: React.FC<StudySummaryProps> = ({
  result,
  onRestartSession,
  onStartWeakSession,
  onGoToWordList,
  onGoHome,
  onGoToDeckManager,
  onCreateDeckFromWeak,
}) => {
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [copyFormat, setCopyFormat] = useState<'tsv' | 'txt' | 'words_only' | 'csv'>('tsv');
  const [listFilter, setListFilter] = useState<'all' | 'weak' | 'correct'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const weakItems = result.cards.filter((c) => !c.isCorrect).map((c) => c.card);
  const correctItems = result.cards.filter((c) => c.isCorrect).map((c) => c.card);

  useEffect(() => {
    // Default filter to weak if there are mistakes, otherwise all
    if (weakItems.length > 0) {
      setListFilter('weak');
    } else {
      setListFilter('all');
    }
  }, []);

  useEffect(() => {
    if (accuracy >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [accuracy]);

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const handleCopyCards = async (cardsToCopy: WordCard[], label: string) => {
    if (cardsToCopy.length === 0) return;
    try {
      const text = exportCards(cardsToCopy, copyFormat, false);
      await navigator.clipboard.writeText(text);
      showToast(`📋 ${label} (${cardsToCopy.length}語) をコピーしました`);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = exportCards(cardsToCopy, copyFormat, false);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(`📋 ${label} (${cardsToCopy.length}語) をコピーしました`);
    }
  };

  const handleCopySingleWord = async (card: WordCard) => {
    try {
      const text = copyFormat === 'tsv'
        ? `${card.word}\t${card.meaning}`
        : copyFormat === 'words_only'
        ? card.word
        : `${card.word} : ${card.meaning}`;
      
      await navigator.clipboard.writeText(text);
      setCopiedId(card.id);
      setTimeout(() => setCopiedId(null), 1500);
      showToast(`📋 「${card.word}」をコピーしました`);
    } catch {
      // ignore
    }
  };

  const displayedCards = result.cards.filter((item) => {
    if (listFilter === 'weak') return !item.isCorrect;
    if (listFilter === 'correct') return item.isCorrect;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200 pb-12">
      
      {/* Top Quick Return Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          id="btn-top-back-to-home"
          onClick={onGoHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>ホームに戻る</span>
        </button>

        <button
          id="btn-top-go-wordlist"
          onClick={onGoToWordList}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <List className="w-3.5 h-3.5" />
          <span>単語一覧を見る →</span>
        </button>
      </div>

      {/* Main Results Trophy Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-8 text-center shadow-xl relative overflow-hidden">
        
        {/* Floating Toast Notification */}
        {copyToast && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* Top-Right Dismiss to Home Button */}
        <button
          onClick={onGoHome}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="ホームに戻る"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-md">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
          学習セッション完了！
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          お疲れ様でした。忘却曲線アルゴリズムに基づいて記憶サイクルが更新されました。
        </p>

        {/* Big Accuracy & Stats Metric */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-md mx-auto mb-6">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
            <div className="text-2xl font-black text-indigo-700">{result.total}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">学習単語数</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200">
            <div className="text-2xl font-black text-emerald-700">{accuracy}%</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">正解率</div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-200">
            <div className="text-2xl font-black text-blue-700">{result.upgraded}</div>
            <div className="text-[11px] font-semibold text-blue-700 mt-0.5">定着度アップ</div>
          </div>
        </div>

        {/* Mistake Copy Highlight Box (if any mistakes) */}
        {weakItems.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50/80 border-2 border-rose-200/90 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-bold text-sm">
                  間違えた単語: <strong className="text-rose-700 font-mono text-base">{weakItems.length}</strong> 語
                </span>
              </div>

              {/* Format selector */}
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white/80 px-2 py-1 rounded-lg border border-rose-200">
                <span>形式:</span>
                <select
                  value={copyFormat}
                  onChange={(e) => setCopyFormat(e.target.value as any)}
                  className="bg-transparent font-bold text-indigo-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="tsv">TSV (タブ区切り)</option>
                  <option value="txt">単語 : 意味</option>
                  <option value="words_only">単語のみ</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Main Copy Button for Mistakes */}
              <button
                id="btn-copy-incorrect-words"
                onClick={() => handleCopyCards(weakItems, '間違えた単語')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>間違えた {weakItems.length} 語をコピー</span>
              </button>

              {/* Study Mistake words again */}
              <button
                id="btn-study-weak-only"
                onClick={() => onStartWeakSession(weakItems)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-300 transition-colors cursor-pointer"
                title="間違えた単語だけで再特訓セッションを開始"
              >
                <Flame className="w-4 h-4 text-rose-600" />
                <span>再特訓</span>
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Buttons Bar */}
        <div className="space-y-2.5 pt-2">
          {/* Main Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto">
            {/* Primary Return to Home Button */}
            <button
              id="btn-return-home"
              onClick={onGoHome}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>ホームに戻る</span>
            </button>

            {/* Restart Session Button */}
            <button
              id="btn-restart-session"
              onClick={onRestartSession}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>同じセットをもう一度</span>
            </button>
          </div>

          {/* Secondary Utilities Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {/* Copy all session words */}
            <button
              id="btn-copy-all-session-words"
              onClick={() => handleCopyCards(result.cards.map((c) => c.card), '全学習単語')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
              title="今回学習した全単語をコピー"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>全 {result.total} 語をコピー</span>
            </button>

            {/* Go to word list */}
            <button
              id="btn-back-to-words"
              onClick={onGoToWordList}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              <List className="w-3.5 h-3.5 text-slate-600" />
              <span>単語一覧</span>
            </button>

            {/* Go to deck manager */}
            {onGoToDeckManager && (
              <button
                id="btn-back-to-decks"
                onClick={onGoToDeckManager}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>単語帳一覧</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review breakdown table with Filter & Individual Copy */}
      {result.cards.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                学習した単語の内訳と結果
              </h3>
              <p className="text-xs text-slate-400">
                各単語の右端のコピーボタンから個別にコピーできます
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setListFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  listFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                すべて ({result.total})
              </button>
              <button
                onClick={() => setListFilter('weak')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  listFilter === 'weak'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>間違えた ({weakItems.length})</span>
              </button>
              <button
                onClick={() => setListFilter('correct')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  listFilter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>正解 ({correctItems.length})</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {displayedCards.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                該当する単語はありません
              </div>
            ) : (
              displayedCards.map((item, idx) => {
                const prevInfo = MASTERY_LABELS[item.prevLevel];
                const newInfo = MASTERY_LABELS[item.newLevel];
                const isJustCopied = copiedId === item.card.id;

                return (
                  <div 
                    key={idx} 
                    className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.isCorrect ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0" title="正解">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0" title="不正解・要復習">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.card.word}
                          </span>
                          {item.card.reading && (
                            <span className="text-[11px] text-indigo-600 font-mono">
                              /{item.card.reading}/
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 truncate mt-0.5">
                          {item.card.meaning}
                        </div>
                        {item.card.example && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            💬 {item.card.example}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Audio + Copy + Mastery badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Audio */}
                      <button
                        onClick={() => speakWord(item.card.word, item.card.language || 'en')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="発音を再生"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      {/* Individual Copy Button */}
                      <button
                        onClick={() => handleCopySingleWord(item.card)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isJustCopied
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                            : 'bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200'
                        }`}
                        title="この単語をコピー"
                      >
                        {isJustCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Mastery badge transition */}
                      <div className="hidden sm:flex items-center gap-1 text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold ${prevInfo.bg} ${prevInfo.color}`}>
                          {prevInfo.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className={`px-2 py-0.5 rounded font-bold ${newInfo.bg} ${newInfo.color}`}>
                          {newInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Table Action Footer */}
          {displayedCards.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                表示中: {displayedCards.length} 件
              </span>
              <button
                onClick={() => handleCopyCards(displayedCards.map((c) => c.card), listFilter === 'weak' ? '間違えた単語' : '表示中の単語')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>表示中の {displayedCards.length} 語をコピー</span>
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
