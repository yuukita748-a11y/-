import React from 'react';
import { Trash2, AlertTriangle, X, FolderOpen, Layers } from 'lucide-react';
import { Deck, WordCard } from '../types';

interface DeleteDeckModalProps {
  isOpen: boolean;
  deck: Deck | null;
  words: WordCard[];
  isOnlyDeck: boolean;
  onClose: () => void;
  onConfirmDelete: (deckId: string) => void;
}

export const DeleteDeckModal: React.FC<DeleteDeckModalProps> = ({
  isOpen,
  deck,
  words,
  isOnlyDeck,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !deck) return null;

  const deckWordsCount = words.filter((w) => w.deckId === deck.id).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-rose-50/70">
          <div className="flex items-center gap-2 text-rose-700">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-rose-900">
              フォルダ（単語帳）の消去確認
            </h3>
          </div>
          <button
            id="btn-close-delete-deck-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">{deck.title}</span>
            </div>
            {deck.description && (
              <p className="text-xs text-slate-500 line-clamp-2 pl-6">
                {deck.description}
              </p>
            )}
            <div className="flex items-center gap-2 pl-6 pt-1 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold text-[11px]">
                {deck.category || '一般'}
              </span>
              <span className="text-rose-600 font-bold font-mono">
                登録単語: {deckWordsCount} 語
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p className="font-medium text-slate-800">
              フォルダ「<span className="font-bold text-rose-700">{deck.title}</span>」を完全に消去しますか？
            </p>
            <p className="text-slate-500">
              この操作を実行すると、フォルダ内に含まれる <strong className="text-slate-700">{deckWordsCount} 件の単語</strong> および学習履歴・定着度データがすべて消去されます。
            </p>
            {isOnlyDeck && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                💡 <strong>ご案内:</strong> この単語帳は最後の1つのため、消去後は新しい空の単語帳が自動で作成されます。
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            id="btn-cancel-delete-deck"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            id="btn-confirm-delete-deck"
            onClick={() => {
              onConfirmDelete(deck.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>フォルダを消去する</span>
          </button>
        </div>

      </div>
    </div>
  );
};
