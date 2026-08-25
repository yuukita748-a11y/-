import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  Layers, 
  Sparkles,
  CheckCircle2,
  FolderDown,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';
import { WordCard, Deck, MasteryLevel } from '../types';
import { exportCards, downloadFile } from '../utils/importExport';
import { MASTERY_LABELS } from '../utils/srs';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: Deck;
  words: WordCard[];
  initialTab?: 'by_mastery' | 'full_deck';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  deck,
  words,
  initialTab = 'by_mastery',
}) => {
  const [activeTab, setActiveTab] = useState<'by_mastery' | 'full_deck'>(initialTab);
  const [format, setFormat] = useState<'tsv' | 'txt' | 'words_only' | 'csv' | 'json'>('tsv');
  const [includeHeader, setIncludeHeader] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const deckWords = words.filter((w) => w.deckId === deck.id);

  // Group words by mastery level (0: 未学習, 1: 覚えたて, 2: 定着中, 3: 習得済, 4: 完璧)
  const masteryGroups: { level: MasteryLevel; label: string; count: number; cards: WordCard[] }[] = [
    { level: 0, label: '未学習', count: 0, cards: [] },
    { level: 1, label: '覚えたて', count: 0, cards: [] },
    { level: 2, label: '定着中', count: 0, cards: [] },
    { level: 3, label: '習得済', count: 0, cards: [] },
    { level: 4, label: '完璧', count: 0, cards: [] },
  ];

  deckWords.forEach((card) => {
    const lvl = (card.masteryLevel >= 0 && card.masteryLevel <= 4) ? card.masteryLevel : 0;
    masteryGroups[lvl].cards.push(card);
    masteryGroups[lvl].count++;
  });

  const handleCopyCategory = (level: MasteryLevel, label: string, cards: WordCard[]) => {
    if (cards.length === 0) return;
    const content = exportCards(cards, format, includeHeader);
    navigator.clipboard.writeText(content);
    setCopiedKey(`cat-${level}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadCategory = (level: MasteryLevel, label: string, cards: WordCard[]) => {
    if (cards.length === 0) return;
    const content = exportCards(cards, format, includeHeader);
    const ext = format === 'tsv' ? 'tsv' : format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'txt';
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    const cleanTitle = deck.title.replace(/[\s/\\:]+/g, '_');
    const filename = `${cleanTitle}_${label}_(${cards.length}語)_${new Date().toISOString().slice(0, 10)}.${ext}`;
    downloadFile(content, filename, mimeType);
  };

  const handleCopyAll = () => {
    const content = exportCards(deckWords, format, includeHeader);
    navigator.clipboard.writeText(content);
    setCopiedKey('all');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadAll = () => {
    const content = exportCards(deckWords, format, includeHeader);
    const ext = format === 'tsv' ? 'tsv' : format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'txt';
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    const filename = `${deck.title.replace(/[\s/\\:]+/g, '_')}_全${deckWords.length}語_${new Date().toISOString().slice(0, 10)}.${ext}`;
    downloadFile(content, filename, mimeType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                単語の個別コピー & エクスポート
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                「{deck.title}」— 未学習・覚えたて・定着中・習得済・完璧を個別にコピー
              </p>
            </div>
          </div>
          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Format Controls Bar */}
        <div className="bg-slate-100/70 p-3 sm:px-6 border-b border-slate-200 space-y-3">
          
          {/* Top Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('by_mastery')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'by_mastery'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 定着度別に個別コピー
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('full_deck')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'full_deck'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📦 単語帳全体の一括出力 ({deckWords.length}語)
              </button>
            </div>

            {/* Header toggle for TSV/CSV */}
            {(format === 'tsv' || format === 'csv') && (
              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>見出し行（単語, 意味...）を含める</span>
              </label>
            )}
          </div>

          {/* Format selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1">コピー形式:</span>
            {[
              { id: 'tsv', label: 'TSV (タブ区切り)', desc: 'Excel / スプレッドシート / Anki用' },
              { id: 'txt', label: 'テキスト (単語 : 意味)', desc: 'メモ帳・チャット貼り付け用' },
              { id: 'words_only', label: '単語のみ (英単語列)', desc: '単語スペルの一覧' },
              { id: 'csv', label: 'CSV (カンマ区切り)', desc: '標準CSV形式' },
              { id: 'json', label: 'JSON', desc: '構造化データ' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setFormat(fmt.id as typeof format)}
                className={`px-2.5 py-1.2 rounded-lg font-bold transition-all whitespace-nowrap text-[11px] cursor-pointer border ${
                  format === fmt.id
                    ? 'bg-white border-indigo-500 text-indigo-700 shadow-xs ring-1 ring-indigo-400'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
                title={fmt.desc}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {activeTab === 'by_mastery' ? (
            /* Tab 1: By Mastery Level */
            <div className="space-y-3">
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>コピーしたい定着度の「<strong>📋 コピー</strong>」ボタンをクリックしてください：</span>
                <span className="text-[11px] text-slate-400 font-mono">計 {deckWords.length} 語</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {masteryGroups.map((group) => {
                  const masteryInfo = MASTERY_LABELS[group.level];
                  const isCopied = copiedKey === `cat-${group.level}`;
                  const hasCards = group.cards.length > 0;

                  return (
                    <div
                      key={group.level}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        hasCards
                          ? 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Status Label & Words Count */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${masteryInfo.bg} ${masteryInfo.color} border ${masteryInfo.border}`}>
                              {masteryInfo.label}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {group.count} 語
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({masteryInfo.sub})
                            </span>
                          </div>

                          {/* Words preview pills */}
                          {hasCards ? (
                            <div className="flex flex-wrap gap-1 max-h-14 overflow-hidden pt-0.5">
                              {group.cards.slice(0, 10).map((c) => (
                                <span 
                                  key={c.id} 
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                                  title={`${c.word}: ${c.meaning}`}
                                >
                                  {c.word}
                                </span>
                              ))}
                              {group.cards.length > 10 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/70 text-slate-500 font-bold self-center">
                                  +他 {group.cards.length - 10} 語
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              このカテゴリの単語は現在ありません
                            </p>
                          )}
                        </div>

                        {/* Action Buttons (Copy & Download) */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            disabled={!hasCards}
                            onClick={() => handleCopyCategory(group.level, group.label, group.cards)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              isCopied
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-102'
                            }`}
                            title={`「${group.label}」の単語 (${group.count}語) をクリップボードにコピー`}
                          >
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{isCopied ? 'コピー完了!' : '📋 コピー'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={!hasCards}
                            onClick={() => handleDownloadCategory(group.level, group.label, group.cards)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            title={`「${group.label}」の単語 (${group.count}語) をダウンロード`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong>便利な使い方:</strong> 「TSV (タブ区切り)」形式でコピーすると、Excel・Googleスプレッドシート・Quizlet・Ankiにそのままペーストするだけで綺麗に表形式で取り込めます。
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Full Deck Export */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>出力データプレビュー ({deckWords.length} 語):</span>
                  <span className="font-mono text-slate-500">{format.toUpperCase()} 形式</span>
                </div>
                <textarea
                  readOnly
                  rows={9}
                  value={exportCards(deckWords, format, includeHeader)}
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden resize-none leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
                    copiedKey === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {copiedKey === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'all' ? '単語帳全体をコピー完了!' : '単語帳全体をクリップボードにコピー'}</span>
                </button>

                <button
                  id="btn-download-export-file"
                  type="button"
                  onClick={handleDownloadAll}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ファイルとして保存 (.{format === 'tsv' ? 'tsv' : format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'txt'})</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/80">
          <span className="text-[11px] text-slate-500">
            コピー形式: <strong className="text-slate-800">{format.toUpperCase()}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
