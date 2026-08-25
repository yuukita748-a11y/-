import React from 'react';
import { X, Sliders, Volume2, Clock, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  if (!isOpen) return null;

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">学習環境設定</h3>
              <p className="text-xs text-slate-500">暗記体験・音声・タイマーの設定を調整できます</p>
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
          
          {/* Audio Setting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                単語の自動音声読み上げ
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                カード表示時やクイズ時にネイティブ発音を自動再生します
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoAudio}
                onChange={(e) => handleChange('autoAudio', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Sound FX Setting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-slate-800">効果音 (SE)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                正解チャイム、めくり音、不正解音を再生します
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundFx}
                onChange={(e) => handleChange('soundFx', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Card Front Side Default */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">カードの初期表面:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('cardFrontSide', 'word')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                  settings.cardFrontSide === 'word'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-400'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                単語・英語 → 意味
              </button>
              <button
                type="button"
                onClick={() => handleChange('cardFrontSide', 'meaning')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                  settings.cardFrontSide === 'meaning'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-400'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                意味・日本語 → 単語
              </button>
            </div>
          </div>

          {/* Quiz Timer Setting */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                4択クイズの制限時間
              </label>
              <span className="font-mono text-indigo-600 font-bold">
                {settings.quizTimer === 0 ? '無制限' : `${settings.quizTimer} 秒`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={settings.quizTimer}
              onChange={(e) => handleChange('quizTimer', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>無制限 (0s)</span>
              <span>5s (超高速)</span>
              <span>10s (標準)</span>
              <span>20s</span>
              <span>30s</span>
            </div>
          </div>

          {/* Reset & Initialization Zone */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <span>データの初期化・リセット</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('すべての登録単語・学習進捗を初期サンプルデータにリセットしますか？')) {
                    onResetAllData();
                    onClose();
                  }
                }}
                className="p-3 text-left rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <div className="font-bold text-slate-800 group-hover:text-indigo-700">初期サンプルデータに戻す</div>
                <div className="text-[10px] text-slate-500 mt-0.5">英語・ドイツ語・フランス語・日本語の初期データ</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('すべての単語の学習進捗・定着度のみを未学習(0)にリセットしますか？（単語自体は消えません）')) {
                    onUpdateSettings(settings); // triggers update
                    window.dispatchEvent(new CustomEvent('reset-progress-only'));
                    onClose();
                  }
                }}
                className="p-3 text-left rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer group"
              >
                <div className="font-bold text-slate-800 group-hover:text-amber-700">学習進捗のみリセット</div>
                <div className="text-[10px] text-slate-500 mt-0.5">登録単語は維持し、正解数・定着度を0クリア</div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
