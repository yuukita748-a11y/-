import React from 'react';
import { X, Keyboard, Sparkles, HelpCircle } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SHORTCUT_GROUPS = [
    {
      title: 'フラッシュカード & タップ開示カード',
      items: [
        { key: 'Space / Enter', desc: 'カードをめくる / 意味を開示する' },
        { key: '1', desc: 'まだ / 苦手 (要復習・Box 1)' },
        { key: '2', desc: '難しかった (1日後復習)' },
        { key: '3', desc: '覚えた (3日後復習・Box 2)' },
        { key: '4', desc: '完璧 (7日後復習・Box 3〜Mastered)' },
        { key: 'S', desc: 'ネイティブ音声発音の再生' },
        { key: 'F', desc: 'お気に入り・苦手マークの切り替え' },
        { key: '← / →', desc: '「まだ」または「覚えた」のショートカット' },
      ],
    },
    {
      title: '4択クイズ & タイピング',
      items: [
        { key: '1, 2, 3, 4', desc: '選択肢 1〜4 を選ぶ' },
        { key: 'Enter', desc: 'タイピング解答 / 次の問題へ進む' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">キーボードショートカット</h3>
              <p className="text-xs text-slate-500">キーボード操作で超高速に暗記を進められます</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {SHORTCUT_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="font-bold text-indigo-900 uppercase tracking-wider text-[11px]">
                {group.title}
              </h4>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 divide-y divide-slate-100">
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <span className="text-slate-600 font-medium">{item.desc}</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-800 text-[11px] shadow-xs shrink-0">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
