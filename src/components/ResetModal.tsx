import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  BookOpen
} from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToSampleData: () => void;
  onResetProgressOnly: () => void;
  onClearAllData: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onResetToSampleData,
  onResetProgressOnly,
  onClearAllData,
}) => {
  const [selectedAction, setSelectedAction] = useState<'sample' | 'progress' | 'empty' | null>(null);
  const [confirmText, setConfirmText] = useState<string>('');

  if (!isOpen) return null;

  const handleExecute = () => {
    if (selectedAction === 'sample') {
      onResetToSampleData();
      onClose();
    } else if (selectedAction === 'progress') {
      onResetProgressOnly();
      onClose();
    } else if (selectedAction === 'empty') {
      onClearAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">アプリデータの初期化</h3>
              <p className="text-xs text-rose-800 font-medium">初期状態への復元・進捗リセット・全消去</p>
            </div>
          </div>
          <button
            id="btn-close-reset-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-800">
          <p className="text-slate-600 leading-relaxed">
            実行したい初期化の種類を選択してください：
          </p>

          {/* Option 1: Initial Sample Data */}
          <button
            type="button"
            onClick={() => setSelectedAction('sample')}
            className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedAction === 'sample'
                ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-300'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  初期サンプルデータに戻す（推奨）
                  {selectedAction === 'sample' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  初期状態の英語・ドイツ語・フランス語・日本語の各単語帳とサンプル単語（約120語）をすべて復元します。
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Reset Learning Progress only */}
          <button
            type="button"
            onClick={() => setSelectedAction('progress')}
            className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedAction === 'progress'
                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  学習履歴・定着度のみリセット
                  {selectedAction === 'progress' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  登録されている単語や単語帳はそのまま残し、正解数・完璧チェック・復習スケジュールのみをすべて「未学習（0）」に戻します。
                </div>
              </div>
            </div>
          </button>

          {/* Option 3: Completely Empty / Clear */}
          <button
            type="button"
            onClick={() => setSelectedAction('empty')}
            className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedAction === 'empty'
                ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-300'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  すべての単語を消去（空の状態で開始）
                  {selectedAction === 'empty' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  登録されているすべての単語と単語帳をクリアし、まっさらな空の状態で1から作成できるようにします。
                </div>
              </div>
            </div>
          </button>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs font-semibold transition-colors"
          >
            キャンセル
          </button>

          <button
            id="btn-confirm-execute-reset"
            type="button"
            disabled={!selectedAction}
            onClick={handleExecute}
            className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              selectedAction === 'empty'
                ? 'bg-rose-600 hover:bg-rose-700'
                : selectedAction === 'progress'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {selectedAction === 'sample' && 'サンプルデータに初期化'}
            {selectedAction === 'progress' && '学習進捗をリセット'}
            {selectedAction === 'empty' && '全消去して初期化'}
            {!selectedAction && '初期化を実行'}
          </button>
        </div>
      </div>
    </div>
  );
};
