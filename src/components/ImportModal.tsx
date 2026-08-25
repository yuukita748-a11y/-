import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Sparkles, 
  Table, 
  ArrowRight,
  RefreshCw,
  FolderPlus,
  Layers,
  Copy,
  Globe,
  Volume2,
  Languages
} from 'lucide-react';
import { Deck, WordCard, LanguageCode, SUPPORTED_LANGUAGES } from '../types';
import { IMPORT_SAMPLE_PRESETS } from '../data/presets';
import { parseImportText, ParseResult } from '../utils/importExport';
import { speakWord } from '../utils/sound';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  activeDeckId: string;
  onImportWords: (
    newWords: Partial<WordCard>[], 
    targetDeckId: string, 
    isNewDeck?: { title: string; category?: string; language?: LanguageCode }
  ) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  decks,
  activeDeckId,
  onImportWords,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedDeckId, setSelectedDeckId] = useState<string>(activeDeckId);
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState<boolean>(false);
  const [newDeckTitle, setNewDeckTitle] = useState<string>('');
  const [newDeckCategory, setNewDeckCategory] = useState<string>('カスタム単語帳');
  
  // Audio / Speech Language setting
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('en');
  
  // Delimiter & Column settings
  const [customDelimiter, setCustomDelimiter] = useState<string>('auto');
  const [hasHeader, setHasHeader] = useState<boolean>(false);
  
  // Custom column mapping
  const [colWord, setColWord] = useState<number>(0);
  const [colMeaning, setColMeaning] = useState<number>(1);
  const [colLanguage, setColLanguage] = useState<number>(-1);
  const [colReading, setColReading] = useState<number>(-1);
  const [colExample, setColExample] = useState<number>(-1);
  const [colNote, setColNote] = useState<number>(-1);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync active deck language when modal opens or selected deck changes
  useEffect(() => {
    if (isOpen) {
      setSelectedDeckId(activeDeckId);
      const currentDeck = decks.find(d => d.id === activeDeckId);
      if (currentDeck?.language) {
        setTargetLanguage(currentDeck.language);
      }
    }
  }, [isOpen, activeDeckId, decks]);

  const handleDeckSelect = (deckId: string) => {
    setSelectedDeckId(deckId);
    const d = decks.find((item) => item.id === deckId);
    if (d?.language) {
      setTargetLanguage(d.language);
    }
  };

  // Parse text whenever input or config changes
  const parseResult: ParseResult = useMemo(() => {
    if (!inputText.trim()) {
      return {
        rows: [],
        detectedDelimiter: '\t',
        totalLines: 0,
        validCount: 0,
        invalidCount: 0,
        sampleHeaders: [],
        rawColumnsPreview: [],
      };
    }

    const delimiter = customDelimiter === 'auto' ? undefined : customDelimiter;

    return parseImportText(inputText, {
      delimiter,
      hasHeader,
      colWord,
      colMeaning,
      colLanguage,
      colReading,
      colExample,
      colNote,
      defaultLanguage: targetLanguage,
    });
  }, [inputText, customDelimiter, hasHeader, colWord, colMeaning, colLanguage, colReading, colExample, colNote, targetLanguage]);

  if (!isOpen) return null;

  // Handle file drop & upload
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setInputText(text);
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        if (!newDeckTitle) {
          setNewDeckTitle(baseName);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = () => {
    const validRows = parseResult.rows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const cardsToImport: Partial<WordCard>[] = validRows.map((r) => ({
      word: r.word,
      meaning: r.meaning,
      language: r.language || targetLanguage,
      reading: r.reading,
      example: r.example,
      exampleMeaning: r.exampleMeaning,
      note: r.note,
      tags: r.tags || [],
    }));

    if (isCreatingNewDeck) {
      const title = newDeckTitle.trim() || '新規単語帳';
      onImportWords(cardsToImport, '', { 
        title, 
        category: newDeckCategory,
        language: targetLanguage
      });
    } else {
      onImportWords(cardsToImport, selectedDeckId);
    }

    onClose();
  };

  const loadPreset = (preset: typeof IMPORT_SAMPLE_PRESETS[0]) => {
    setInputText(preset.sample);
    if (preset.lang && preset.lang !== 'auto') {
      setTargetLanguage(preset.lang as LanguageCode);
    }
    if (preset.format === 'tsv') {
      setCustomDelimiter('auto');
      setColWord(0);
      setColMeaning(1);
      setColReading(2);
      setColExample(3);
      setColNote(-1);
    } else if (preset.format === 'sentence-tsv') {
      setCustomDelimiter('auto');
      setColWord(0);
      setColMeaning(1);
      setColNote(2);
      setColReading(-1);
      setColExample(-1);
    } else if (preset.format === 'csv') {
      setCustomDelimiter(',');
      setColWord(0);
      setColMeaning(1);
      setColReading(2);
      setColExample(3);
      setColNote(-1);
    } else if (preset.format === 'delimiter') {
      setCustomDelimiter('auto');
      setColWord(0);
      setColMeaning(1);
      setColNote(-1);
    } else if (preset.format === 'json') {
      setCustomDelimiter('auto');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">単語の一括インポート</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                英語・ドイツ語・フランス語・日本語の単語と音声（TTS）をセットして一括登録
              </p>
            </div>
          </div>
          <button
            id="btn-close-import-modal"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-slate-800">
          
          {/* Target Deck & Audio Language Selection */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            
            {/* Step 1: Destination Selection */}
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                1. インポート先の設定
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label 
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    !isCreatingNewDeck 
                      ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/50' 
                      : 'bg-white border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="deck-target"
                    checked={!isCreatingNewDeck}
                    onChange={() => setIsCreatingNewDeck(false)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900">既存の単語帳に追加</div>
                    <select
                      id="select-import-existing-deck"
                      disabled={isCreatingNewDeck}
                      value={selectedDeckId}
                      onChange={(e) => handleDeckSelect(e.target.value)}
                      className="mt-1.5 w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {decks.map((deck) => {
                        const l = SUPPORTED_LANGUAGES[deck.language || 'en'];
                        return (
                          <option key={deck.id} value={deck.id}>
                            {l?.flag || ''} {deck.title} ({deck.category || '一般'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </label>

                <label 
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isCreatingNewDeck 
                      ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/50' 
                      : 'bg-white border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="deck-target"
                    checked={isCreatingNewDeck}
                    onChange={() => setIsCreatingNewDeck(true)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="text-xs font-semibold text-slate-900">新しい単語帳を自動作成</div>
                    <input
                      id="input-import-new-deck-title"
                      type="text"
                      disabled={!isCreatingNewDeck}
                      placeholder="例: ドイツ語 A1頻出、フランス語 旅の表現"
                      value={newDeckTitle}
                      onChange={(e) => setNewDeckTitle(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-medium"
                    />
                    {isCreatingNewDeck && (
                      <input
                        type="text"
                        placeholder="カテゴリ (例: 外国語, 資格, 旅行)"
                        value={newDeckCategory}
                        onChange={(e) => setNewDeckCategory(e.target.value)}
                        className="text-[11px] bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 w-full"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Step 2: Audio Language Specification (TTS) */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  <span>2. 音声読み上げ（TTS）対応言語をセット</span>
                </div>
                <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ネイティブ発音で自動読み上げ</span>
                </div>
              </div>

              {/* Language Selection Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.values(SUPPORTED_LANGUAGES).map((lang) => {
                  const isSelected = targetLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setTargetLanguage(lang.code)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {lang.shortLabel}
                        </div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {lang.ttsLang}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Quick Format Presets (One-click sample load) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                サンプルデータで試す（言語別フォーマット例）
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {IMPORT_SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  id={`btn-preset-${idx}`}
                  type="button"
                  onClick={() => loadPreset(preset)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-200 active:scale-95 transition-all group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                    {preset.title}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Text Area & Drag-Drop Area */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="import-textarea" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                単語データの貼り付け または ファイルのドロップ
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  accept=".csv,.tsv,.txt,.json"
                  className="hidden"
                />
                <button
                  id="btn-choose-file"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  ファイル選択 (.csv/.tsv/.txt)
                </button>
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="text-xs text-slate-400 hover:text-rose-600 ml-2 cursor-pointer"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>

            {/* Mode Switcher / Tab Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setColWord(0);
                    setColMeaning(1);
                    setColReading(2);
                    setColExample(3);
                    setColNote(-1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    colNote === -1
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📖 通常単語インポート (単語・意味・発音・例文)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setColWord(0);
                    setColMeaning(1);
                    setColNote(2);
                    setColReading(-1);
                    setColExample(-1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    colNote === 2 && colWord === 0 && colMeaning === 1
                      ? 'bg-white text-emerald-700 shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 例文専用インポート (表:例文 / 裏:訳・解説)
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium px-2">
                {colNote === 2 && colWord === 0 && colMeaning === 1 ? (
                  <span className="text-emerald-700 font-bold">✨ 例文特化モード: 列1=例文(表), 列2=日本語訳(裏), 列3=文法・解説</span>
                ) : (
                  <span>列1=単語, 列2=意味, 列3=読み, 列4=例文</span>
                )}
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
            >
              <textarea
                id="import-textarea"
                rows={6}
                placeholder={`ここにExcelやスプレッドシートからコピーした表、または以下のようなテキストを貼り付けてください：

apple	りんご	ˈæp.əl	I ate an apple.
die Möglichkeit	可能性	ˈmøːklɪçkaɪt	Wir haben viele Möglichkeiten.
magnifique	素晴らしい	ma.ɲi.fik	C'est magnifique!
cat : ねこ
dog - いぬ`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3.5 text-xs font-mono text-slate-800 bg-transparent border-0 focus:outline-hidden focus:ring-0 resize-y leading-relaxed"
              />
            </div>
            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>💡 <strong>Excel / Google Sheets</strong>: セルをそのまま選択してコピー＆ペーストするだけで自動認識されます。</span>
              <span>💡 <strong>ドイツ語・フランス語</strong>: 特殊文字(ä, ö, ü, ß, é, è, ç, etc.)や冠詞付き単語もそのままインポート可能です。</span>
            </div>
          </div>

          {/* Advanced Parsing Options */}
          <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              
              {/* Delimiter selector */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">区切り文字:</span>
                <select
                  id="select-import-delimiter"
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="auto">自動判定 (推奨)</option>
                  <option value="&#9;">タブ区切り (TSV / Excel)</option>
                  <option value=",">カンマ区切り (CSV)</option>
                  <option value=":">コロン区切り (:)</option>
                  <option value="-">ハイフン・矢印 (- / -&gt;)</option>
                  <option value="|">パイプ (|)</option>
                </select>
              </div>

              {/* Header checkbox */}
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  id="checkbox-has-header"
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(e) => setHasHeader(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                1行目はヘッダーとしてスキップ
              </label>

              {/* Detected info badge */}
              {inputText.trim() && (
                <div className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  検出: {parseResult.detectedDelimiter === '\t' ? 'タブ区切り' : parseResult.detectedDelimiter === ',' ? 'CSV' : parseResult.detectedDelimiter === 'json' ? 'JSON' : parseResult.detectedDelimiter}
                </div>
              )}
            </div>

            {/* Column Mapping Selectors (if text exists) */}
            {parseResult.sampleHeaders.length > 2 && (
              <div className="pt-2 border-t border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600 mb-2">列の割り当て:</div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">単語 (表面) *</label>
                    <select
                      value={colWord}
                      onChange={(e) => setColWord(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    >
                      {parseResult.sampleHeaders.map((h, i) => (
                        <option key={i} value={i}>列 {i + 1}: {h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">意味 (裏面) *</label>
                    <select
                      value={colMeaning}
                      onChange={(e) => setColMeaning(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    >
                      {parseResult.sampleHeaders.map((h, i) => (
                        <option key={i} value={i}>列 {i + 1}: {h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">言語列 (任意)</label>
                    <select
                      value={colLanguage}
                      onChange={(e) => setColLanguage(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700"
                    >
                      <option value={-1}>固定 ({SUPPORTED_LANGUAGES[targetLanguage]?.shortLabel})</option>
                      {parseResult.sampleHeaders.map((h, i) => (
                        <option key={i} value={i}>列 {i + 1}: {h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">発音・読み (任意)</label>
                    <select
                      value={colReading}
                      onChange={(e) => setColReading(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value={-1}>なし</option>
                      {parseResult.sampleHeaders.map((h, i) => (
                        <option key={i} value={i}>列 {i + 1}: {h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">例文 (任意)</label>
                    <select
                      value={colExample}
                      onChange={(e) => setColExample(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value={-1}>なし</option>
                      {parseResult.sampleHeaders.map((h, i) => (
                        <option key={i} value={i}>列 {i + 1}: {h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">メモ・解説 (任意)</label>
                    <select
                      value={colNote}
                      onChange={(e) => setColNote(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value={-1}>なし</option>
                      {parseResult.sampleHeaders.map((h, i) => (
                        <option key={i} value={i}>列 {i + 1}: {h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Table with Audio Test */}
          {inputText.trim() && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">プレビュー ({parseResult.rows.length} 件)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    インポート可能: {parseResult.validCount} 件
                  </span>
                  {parseResult.invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" />
                      不備あり: {parseResult.invalidCount} 件
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 z-10 font-semibold">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3">単語 (表面)</th>
                      <th className="py-2 px-3">意味 (裏面)</th>
                      <th className="py-2 px-3 text-center">音声言語</th>
                      <th className="py-2 px-3">発音・読み</th>
                      <th className="py-2 px-3">例文 / 補足</th>
                      <th className="py-2 px-3 w-16 text-center">状態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parseResult.rows.slice(0, 15).map((row, idx) => {
                      const rowLang = row.language || targetLanguage;
                      const langConfig = SUPPORTED_LANGUAGES[rowLang];

                      return (
                        <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/50'}>
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{row.word || <span className="text-rose-400 italic">(空)</span>}</span>
                              {row.word && (
                                <button
                                  type="button"
                                  onClick={() => speakWord(row.word, rowLang)}
                                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title={`${langConfig.label}で音声テスト`}
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-700">{row.meaning || <span className="text-rose-400 italic">(空)</span>}</td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-700">
                              <span>{langConfig.flag}</span>
                              <span>{langConfig.shortLabel}</span>
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{row.reading || '-'}</td>
                          <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{row.example || row.note || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            {row.isValid ? (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">OK</span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded" title={row.error}>
                                エラー
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {parseResult.rows.length > 15 && (
                <div className="text-[11px] text-center text-slate-400 italic">
                  ※プレビューは先頭15件を表示中（全 {parseResult.rows.length} 件がインポートされます）
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50/90 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            キャンセル
          </button>

          <div className="flex items-center gap-3">
            <button
              id="btn-submit-import"
              type="button"
              disabled={parseResult.validCount === 0}
              onClick={handleExecuteImport}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {SUPPORTED_LANGUAGES[targetLanguage]?.flag} {SUPPORTED_LANGUAGES[targetLanguage]?.shortLabel}音声で {parseResult.validCount} 件を一括登録
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
