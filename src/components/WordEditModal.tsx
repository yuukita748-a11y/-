import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, BookPlus, Volume2, Sparkles } from 'lucide-react';
import { WordCard, Deck, LanguageCode, SUPPORTED_LANGUAGES, WordGender } from '../types';
import { speakWord } from '../utils/sound';
import { GENDER_CONFIGS, detectGenderFromContent } from '../utils/gender';

interface WordEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wordData: Partial<WordCard>) => void;
  initialData?: WordCard | null;
  decks: Deck[];
  currentDeckId: string;
}

export const WordEditModal: React.FC<WordEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  decks,
  currentDeckId,
}) => {
  const [deckId, setDeckId] = useState<string>(currentDeckId);
  const [language, setLanguage] = useState<LanguageCode>('auto');
  const [gender, setGender] = useState<WordGender>('none');
  const [word, setWord] = useState<string>('');
  const [meaning, setMeaning] = useState<string>('');
  const [reading, setReading] = useState<string>('');
  const [example, setExample] = useState<string>('');
  const [exampleMeaning, setExampleMeaning] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [isGenderManuallySet, setIsGenderManuallySet] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setDeckId(initialData.deckId);
      setLanguage(initialData.language || 'auto');
      setGender(initialData.gender || detectGenderFromContent(initialData.word, initialData.tags, initialData.note, initialData.language));
      setIsGenderManuallySet(Boolean(initialData.gender));
      setWord(initialData.word);
      setMeaning(initialData.meaning);
      setReading(initialData.reading || '');
      setExample(initialData.example || '');
      setExampleMeaning(initialData.exampleMeaning || '');
      setNote(initialData.note || '');
      setTagsInput((initialData.tags || []).join(', '));
    } else {
      const parentDeck = decks.find((d) => d.id === currentDeckId);
      setDeckId(currentDeckId);
      setLanguage(parentDeck?.language || 'auto');
      setGender('none');
      setIsGenderManuallySet(false);
      setWord('');
      setMeaning('');
      setReading('');
      setExample('');
      setExampleMeaning('');
      setNote('');
      setTagsInput('');
    }
  }, [initialData, currentDeckId, isOpen, decks]);

  // Auto-detect gender as user types word if not manually overridden
  const handleWordChange = (newWord: string) => {
    setWord(newWord);
    if (!isGenderManuallySet) {
      const detected = detectGenderFromContent(newWord, [], note, effectiveLang);
      if (detected !== 'none') {
        setGender(detected);
      }
    }
  };

  if (!isOpen) return null;

  const currentDeck = decks.find((d) => d.id === deckId);
  const effectiveLang = language === 'auto' ? currentDeck?.language || 'en' : language;
  const currentGenderConfig = GENDER_CONFIGS[gender];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) return;

    const tags = tagsInput
      .split(/[,、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      deckId,
      language: language !== 'auto' ? language : undefined,
      gender: gender !== 'none' ? gender : undefined,
      word: word.trim(),
      meaning: meaning.trim(),
      reading: reading.trim() || undefined,
      example: example.trim() || undefined,
      exampleMeaning: exampleMeaning.trim() || undefined,
      note: note.trim() || undefined,
      tags,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {initialData ? '単語の編集' : '単語の新規追加'}
              </h3>
              <p className="text-xs text-slate-500">英語・ドイツ語・フランス語・日本語に対応</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          
          {/* Deck Select & Language Select Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">所属する単語帳 *</label>
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">言語設定 (発音・音声)</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="auto">単語帳に合わせる / 自動判定</option>
                {Object.values(SUPPORTED_LANGUAGES).filter(l => l.code !== 'auto').map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Word (Front) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">単語 / 質問 (表面) *</label>
              {word && (
                <button
                  type="button"
                  onClick={() => speakWord(word, effectiveLang)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>発音テスト ({SUPPORTED_LANGUAGES[effectiveLang]?.flag})</span>
                </button>
              )}
            </div>
            <input
              id="input-edit-word"
              type="text"
              required
              placeholder="例: ubiquitous, die Möglichkeit, der Tisch, magnifique"
              value={word}
              onChange={(e) => handleWordChange(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Grammatical Gender (文法上の性別・冠詞) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-xs">単語の性別 (カード背景色)</span>
                <span className="text-[10px] text-slate-400">ドイツ語・フランス語・スペイン語等</span>
              </div>
              {gender !== 'none' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentGenderConfig.badgeClass}`}>
                  {currentGenderConfig.symbol} {currentGenderConfig.label} ({currentGenderConfig.articleHint})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {/* None */}
              <button
                type="button"
                onClick={() => {
                  setGender('none');
                  setIsGenderManuallySet(true);
                }}
                className={`py-2 px-2 rounded-xl text-center font-bold text-xs border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  gender === 'none'
                    ? 'bg-white border-slate-400 text-slate-800 shadow-xs ring-2 ring-slate-300'
                    : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700'
                }`}
              >
                <span className="text-xs">—</span>
                <span className="text-[11px]">指定なし</span>
              </button>

              {/* Masculine */}
              <button
                type="button"
                onClick={() => {
                  setGender('masculine');
                  setIsGenderManuallySet(true);
                }}
                className={`py-2 px-2 rounded-xl text-center font-bold text-xs border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  gender === 'masculine'
                    ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-xs ring-2 ring-sky-300'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200'
                }`}
              >
                <span className="text-sky-600 text-xs">♂ 男性</span>
                <span className="text-[10px] font-normal text-sky-700 font-mono">der / le / el</span>
              </button>

              {/* Feminine */}
              <button
                type="button"
                onClick={() => {
                  setGender('feminine');
                  setIsGenderManuallySet(true);
                }}
                className={`py-2 px-2 rounded-xl text-center font-bold text-xs border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  gender === 'feminine'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs ring-2 ring-rose-300'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                }`}
              >
                <span className="text-rose-600 text-xs">♀ 女性</span>
                <span className="text-[10px] font-normal text-rose-700 font-mono">die / la / une</span>
              </button>

              {/* Neuter */}
              <button
                type="button"
                onClick={() => {
                  setGender('neuter');
                  setIsGenderManuallySet(true);
                }}
                className={`py-2 px-2 rounded-xl text-center font-bold text-xs border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  gender === 'neuter'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs ring-2 ring-emerald-300'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                }`}
              >
                <span className="text-emerald-600 text-xs">⚪ 中性</span>
                <span className="text-[10px] font-normal text-emerald-700 font-mono">das (n)</span>
              </button>
            </div>

            {/* Background preview mini-badge */}
            <div className={`p-2 rounded-xl border text-[11px] flex items-center justify-between transition-colors ${currentGenderConfig.cardBgClass} ${currentGenderConfig.cardBorderClass}`}>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">カード背景プレビュー:</span>
                <span className="font-bold text-slate-900">{gender === 'none' ? '標準 (白)' : `${currentGenderConfig.label} カラー`}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentGenderConfig.badgeClass}`}>
                {gender === 'none' ? 'デフォルト' : `${currentGenderConfig.symbol} ${currentGenderConfig.label}`}
              </span>
            </div>
          </div>

          {/* Meaning (Back) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">意味 / 解答 (裏面) *</label>
            <input
              id="input-edit-meaning"
              type="text"
              required
              placeholder="例: 至る所にある、偏在する"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Reading / Pronunciation */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">発音記号・読み方 (任意)</label>
            <input
              type="text"
              placeholder="例: juːˈbɪk.wɪ.təs / ˈmøːklɪçkaɪt / ma.ɲi.fik"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Example Sentence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">例文 (任意)</label>
              <input
                type="text"
                placeholder="例: Smartphones are now ubiquitous."
                value={example}
                onChange={(e) => setExample(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">例文の日本語訳 (任意)</label>
              <input
                type="text"
                placeholder="例: スマホは今やどこにでもある。"
                value={exampleMeaning}
                onChange={(e) => setExampleMeaning(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Note / Etymology */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">メモ・語源・類義語 (任意)</label>
            <textarea
              rows={2}
              placeholder="例: 女性名詞(die)。synonym: omnipresent"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">タグ (カンマ区切り)</label>
            <input
              type="text"
              placeholder="例: ドイツ語, 名詞, 頻出"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              キャンセル
            </button>
            <button
              id="btn-save-word"
              type="submit"
              disabled={!word.trim() || !meaning.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>保存する</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
