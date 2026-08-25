import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Upload, 
  Download, 
  PlusCircle, 
  RotateCcw, 
  Flame, 
  Play, 
  CheckCircle2, 
  Layers, 
  HelpCircle,
  Clock,
  Shuffle,
  Star,
  Zap,
  ListOrdered,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { Deck, WordCard, StudyMode, MasteryLevel, StudyResult, LanguageCode } from './types';
import { 
  loadDecks, 
  saveDecks, 
  loadWords, 
  saveWords, 
  loadSettings, 
  saveSettings, 
  loadActiveDeckId, 
  saveActiveDeckId, 
  resetToInitialData,
  resetAllProgress,
  clearAllDataToEmpty,
  AppSettings 
} from './utils/storage';
import { isCardDueForReview, isWeakCard, MASTERY_LABELS, getDeckStudyStatus, formatRelativeStudyTime } from './utils/srs';

// Components
import { Navbar } from './components/Navbar';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { WordEditModal } from './components/WordEditModal';
import { DeckManager } from './components/DeckManager';
import { WordList } from './components/WordList';
import { FlashcardStudy } from './components/FlashcardStudy';
import { RevealCardStudy } from './components/RevealCardStudy';
import { MemorizationSheet } from './components/MemorizationSheet';
import { QuizStudy } from './components/QuizStudy';
import { TypingStudy } from './components/TypingStudy';
import { SpeedReview } from './components/SpeedReview';
import { StudySummary } from './components/StudySummary';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ResetModal } from './components/ResetModal';

export default function App() {
  const [decks, setDecks] = useState<Deck[]>(loadDecks);
  const [words, setWords] = useState<WordCard[]>(loadWords);
  const [activeDeckId, setActiveDeckId] = useState<string>(loadActiveDeckId);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Navigation & Study state
  const [currentView, setCurrentView] = useState<'study' | 'deckManager' | 'wordList'>('study');
  const [activeStudyMode, setActiveStudyMode] = useState<StudyMode>('flashcard');
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [studyFilterScope, setStudyFilterScope] = useState<'all' | 'due' | 'weak' | 'unlearned'>('all');
  const [studyBatchSize, setStudyBatchSize] = useState<number>(20);
  const [isShuffled, setIsShuffled] = useState<boolean>(true);

  // Active study session state
  const [sessionCards, setSessionCards] = useState<WordCard[]>([]);
  const [sessionResult, setSessionResult] = useState<StudyResult | null>(null);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isWordEditOpen, setIsWordEditOpen] = useState<boolean>(false);
  const [editingWord, setEditingWord] = useState<WordCard | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to localStorage
  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  useEffect(() => {
    saveWords(words);
  }, [words]);

  useEffect(() => {
    saveActiveDeckId(activeDeckId);
  }, [activeDeckId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Active deck object
  const activeDeck = useMemo(() => {
    return decks.find((d) => d.id === activeDeckId) || decks[0];
  }, [decks, activeDeckId]);

  // Words belonging to current deck
  const currentDeckWords = useMemo(() => {
    return words.filter((w) => w.deckId === activeDeckId);
  }, [words, activeDeckId]);

  // Review statistics
  const dueCount = useMemo(() => {
    return currentDeckWords.filter(isCardDueForReview).length;
  }, [currentDeckWords]);

  const weakCount = useMemo(() => {
    return currentDeckWords.filter(isWeakCard).length;
  }, [currentDeckWords]);

  const unlearnedCount = useMemo(() => {
    return currentDeckWords.filter((w) => w.masteryLevel === 0).length;
  }, [currentDeckWords]);

  const masteredCount = useMemo(() => {
    return currentDeckWords.filter((w) => w.masteryLevel >= 3).length;
  }, [currentDeckWords]);

  // Active deck study status (today's study tracking)
  const activeDeckStatus = useMemo(() => {
    return activeDeck ? getDeckStudyStatus(activeDeck, currentDeckWords) : null;
  }, [activeDeck, currentDeckWords]);

  // All decks statuses
  const allDeckStatuses = useMemo(() => {
    return decks.map((d) => {
      const dWords = words.filter((w) => w.deckId === d.id);
      return {
        deck: d,
        status: getDeckStudyStatus(d, dWords),
      };
    });
  }, [decks, words]);

  const studiedTodayDecksCount = useMemo(() => {
    return allDeckStatuses.filter((item) => item.status.isStudiedToday).length;
  }, [allDeckStatuses]);

  // Bulk Import Handler
  const handleImportWords = (
    newWordList: Partial<WordCard>[],
    targetDeckId: string,
    isNewDeck?: { title: string; category?: string; language?: LanguageCode }
  ) => {
    let finalDeckId = targetDeckId;
    const targetDeck = decks.find((d) => d.id === targetDeckId);

    // Create new deck if requested
    if (isNewDeck) {
      const newDeck: Deck = {
        id: `deck-${Date.now()}`,
        title: isNewDeck.title,
        description: `${newWordList.length} 語をインポート`,
        category: isNewDeck.category || 'カスタム',
        language: isNewDeck.language || 'en',
        color: 'indigo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setDecks((prev) => [newDeck, ...prev]);
      finalDeckId = newDeck.id;
      setActiveDeckId(newDeck.id);
    }

    const now = Date.now();
    const fallbackLang = isNewDeck?.language || targetDeck?.language || 'en';

    const createdCards: WordCard[] = newWordList.map((item, idx) => ({
      id: `w-${now}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      deckId: finalDeckId,
      word: item.word || '',
      meaning: item.meaning || '',
      language: item.language || fallbackLang,
      reading: item.reading,
      example: item.example,
      exampleMeaning: item.exampleMeaning,
      note: item.note,
      tags: item.tags || [],
      isFavorite: false,
      masteryLevel: 0,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      createdAt: now,
      updatedAt: now,
    }));

    setWords((prev) => [...createdCards, ...prev]);
    showToast(`🎉 ${createdCards.length} 件の単語を一括インポートしました！`);
  };

  // Single word save / update
  const handleSaveWord = (wordData: Partial<WordCard>) => {
    if (editingWord) {
      // Update existing
      setWords((prev) =>
        prev.map((w) =>
          w.id === editingWord.id
            ? { ...w, ...wordData, updatedAt: Date.now() }
            : w
        )
      );
      showToast('単語を更新しました');
    } else {
      // Add new
      const newCard: WordCard = {
        id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        deckId: wordData.deckId || activeDeckId,
        word: wordData.word || '',
        meaning: wordData.meaning || '',
        reading: wordData.reading,
        example: wordData.example,
        exampleMeaning: wordData.exampleMeaning,
        note: wordData.note,
        tags: wordData.tags || [],
        isFavorite: false,
        masteryLevel: 0,
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setWords((prev) => [newCard, ...prev]);
      showToast('単語を追加しました');
    }
  };

  const handleDeleteWord = (id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
    showToast('単語を削除しました');
  };

  const handleBulkDelete = (ids: string[]) => {
    const idSet = new Set(ids);
    setWords((prev) => prev.filter((w) => !idSet.has(w.id)));
    showToast(`${ids.length} 件の単語を削除しました`);
  };

  const handleBulkResetProgress = (ids: string[]) => {
    const idSet = new Set(ids);
    setWords((prev) =>
      prev.map((w) =>
        idSet.has(w.id)
          ? {
              ...w,
              masteryLevel: 0,
              reviewCount: 0,
              correctCount: 0,
              incorrectCount: 0,
              nextReviewDue: undefined,
              updatedAt: Date.now(),
            }
          : w
      )
    );
    showToast(`${ids.length} 件の学習進捗をリセットしました`);
  };

  const handleToggleFavorite = (id: string) => {
    setWords((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isFavorite: !w.isFavorite, updatedAt: Date.now() } : w
      )
    );
  };

  // Deck Management
  const handleCreateDeck = (
    title: string,
    description: string,
    category: string,
    color: string,
    language: LanguageCode = 'en'
  ) => {
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title,
      description,
      category,
      language,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDecks((prev) => [newDeck, ...prev]);
    setActiveDeckId(newDeck.id);
    showToast(`単語帳「${title}」を作成しました`);
  };

  const handleUpdateDeck = (updatedDeck: Deck) => {
    setDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
    showToast('単語帳情報を更新しました');
  };

  const handleDeleteDeck = (id: string) => {
    const targetDeck = decks.find((d) => d.id === id);
    const targetWordCount = words.filter((w) => w.deckId === id).length;
    const remainingDecks = decks.filter((d) => d.id !== id);

    if (remainingDecks.length === 0) {
      const defaultDeck: Deck = {
        id: `deck-${Date.now()}`,
        title: '新しい単語帳',
        description: '新規単語帳',
        category: '一般',
        language: 'en',
        color: 'indigo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setDecks([defaultDeck]);
      setWords((prev) => prev.filter((w) => w.deckId !== id));
      setActiveDeckId(defaultDeck.id);
      showToast(`🗑️ フォルダ「${targetDeck?.title || ''}」(${targetWordCount}語) を消去しました`);
    } else {
      setDecks(remainingDecks);
      setWords((prev) => prev.filter((w) => w.deckId !== id));
      if (activeDeckId === id) {
        setActiveDeckId(remainingDecks[0].id);
      }
      showToast(`🗑️ フォルダ「${targetDeck?.title || ''}」(${targetWordCount}語) を消去しました`);
    }
  };

  // Start study session
  const handleStartStudySession = (
    mode: StudyMode = activeStudyMode,
    customCards?: WordCard[]
  ) => {
    let pool: WordCard[] = customCards || [...currentDeckWords];

    if (!customCards) {
      if (studyFilterScope === 'due') {
        pool = pool.filter(isCardDueForReview);
      } else if (studyFilterScope === 'weak') {
        pool = pool.filter(isWeakCard);
      } else if (studyFilterScope === 'unlearned') {
        pool = pool.filter((w) => w.masteryLevel === 0);
      }
    }

    if (pool.length === 0) {
      showToast('⚠️ 条件に該当する単語がありません。スコープを変更してください。');
      return;
    }

    let finalCards = [...pool];
    if (isShuffled) {
      finalCards.sort(() => 0.5 - Math.random());
    }

    if (studyBatchSize > 0 && finalCards.length > studyBatchSize) {
      finalCards = finalCards.slice(0, studyBatchSize);
    }

    setSessionCards(finalCards);
    setSessionResult({
      total: finalCards.length,
      correct: 0,
      incorrect: 0,
      upgraded: 0,
      cards: [],
      startTime: Date.now(),
      endTime: 0,
    });
    setActiveStudyMode(mode);
    setIsStudying(true);
    setCurrentView('study');
  };

  // Update card during active study
  const handleUpdateCardInSession = (
    updatedCard: WordCard,
    isCorrect: boolean,
    prevLevel: MasteryLevel,
    newLevel: MasteryLevel
  ) => {
    const now = Date.now();
    // Update global state
    setWords((prev) => prev.map((w) => (w.id === updatedCard.id ? updatedCard : w)));

    // Update deck lastStudiedAt
    setDecks((prev) =>
      prev.map((d) => (d.id === updatedCard.deckId ? { ...d, lastStudiedAt: now, updatedAt: now } : d))
    );

    // Update session cards state so active study views receive updated card immediately
    setSessionCards((prev) => prev.map((w) => (w.id === updatedCard.id ? updatedCard : w)));

    // Track session stats
    setSessionResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
        upgraded: newLevel > prevLevel ? prev.upgraded + 1 : prev.upgraded,
        cards: [
          ...prev.cards,
          {
            card: updatedCard,
            isCorrect,
            prevLevel,
            newLevel,
          },
        ],
      };
    });
  };

  const handleFinishStudySession = () => {
    const now = Date.now();
    setSessionResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        endTime: now,
      };
    });
    setDecks((prev) =>
      prev.map((d) => (d.id === activeDeckId ? { ...d, lastStudiedAt: now, updatedAt: now } : d))
    );
    setIsStudying(false);
  };

  // Reset to initial demo dataset
  const handleResetAllData = () => {
    resetToInitialData();
    setDecks(loadDecks());
    setWords(loadWords());
    setActiveDeckId(loadActiveDeckId());
    setIsStudying(false);
    showToast('✨ 初期サンプルデータに復元しました');
  };

  // Reset only learning progress
  const handleResetProgressOnly = () => {
    const updated = resetAllProgress();
    setWords(updated);
    setIsStudying(false);
    showToast('🔄 全単語の学習進捗・定着度を0にリセットしました');
  };

  // Clear all data to fresh empty state
  const handleClearAllData = () => {
    const cleared = clearAllDataToEmpty();
    setDecks(cleared.decks);
    setWords(cleared.words);
    setActiveDeckId(cleared.activeDeckId);
    setIsStudying(false);
    showToast('🗑️ すべてのデータをクリアして新規単語帳を作成しました');
  };

  // Listen for reset progress custom event if dispatched
  useEffect(() => {
    const handleEvent = () => handleResetProgressOnly();
    window.addEventListener('reset-progress-only', handleEvent);
    return () => window.removeEventListener('reset-progress-only', handleEvent);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        decks={decks}
        activeDeckId={activeDeckId}
        onSelectDeck={(id) => {
          setActiveDeckId(id);
          setIsStudying(false);
          setSessionResult(null);
        }}
        words={words}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenDeckManager={() => {
          setCurrentView('deckManager');
          setIsStudying(false);
          setSessionResult(null);
        }}
        onOpenAddWord={() => {
          setEditingWord(null);
          setIsWordEditOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenReset={() => setIsResetOpen(true)}
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsStudying(false);
          setSessionResult(null);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: STUDY DASHBOARD & ACTIVE SESSIONS */}
        {currentView === 'study' && (
          <div>
            {/* If in active study session */}
            {isStudying ? (
              <div className="space-y-4">
                {/* Back / Quit button */}
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  <button
                    onClick={() => {
                      if (confirm('学習セッションを中断してダッシュボードに戻りますか？')) {
                        setIsStudying(false);
                      }
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                  >
                    ← セッションを中断して戻る
                  </button>
                  <span className="text-xs font-bold text-indigo-700">
                    {activeStudyMode === 'flashcard' && '🎴 フラッシュカード学習 (めくり学習)'}
                    {activeStudyMode === 'reveal' && '👆 タップ開示カード (意味隠し・4段階評価)'}
                    {activeStudyMode === 'sheet' && '📄 単語一覧暗記シート (日本語隠し＆完璧チェック)'}
                    {activeStudyMode === 'quiz' && '📝 4択クイズテスト'}
                    {activeStudyMode === 'typing' && '⌨️ スペル・タイピング'}
                    {activeStudyMode === 'speed' && '⚡ 高速自動送り・音読'}
                  </span>
                </div>

                {activeStudyMode === 'flashcard' && (
                  <FlashcardStudy
                    cards={sessionCards}
                    onUpdateCard={handleUpdateCardInSession}
                    onFinishSession={handleFinishStudySession}
                    settings={settings}
                  />
                )}

                {activeStudyMode === 'reveal' && (
                  <RevealCardStudy
                    cards={sessionCards}
                    onUpdateCard={handleUpdateCardInSession}
                    onFinishSession={handleFinishStudySession}
                    settings={settings}
                  />
                )}

                {activeStudyMode === 'sheet' && (
                  <MemorizationSheet
                    cards={sessionCards}
                    onUpdateCard={handleUpdateCardInSession}
                    onFinishSession={handleFinishStudySession}
                    onToggleFavorite={handleToggleFavorite}
                    settings={settings}
                  />
                )}

                {activeStudyMode === 'quiz' && (
                  <QuizStudy
                    cards={sessionCards}
                    allDeckCards={currentDeckWords}
                    onUpdateCard={handleUpdateCardInSession}
                    onFinishSession={handleFinishStudySession}
                    settings={settings}
                  />
                )}

                {activeStudyMode === 'typing' && (
                  <TypingStudy
                    cards={sessionCards}
                    onUpdateCard={handleUpdateCardInSession}
                    onFinishSession={handleFinishStudySession}
                    settings={settings}
                  />
                )}

                {activeStudyMode === 'speed' && (
                  <SpeedReview
                    cards={sessionCards}
                    onFinishSession={handleFinishStudySession}
                    settings={settings}
                  />
                )}
              </div>
            ) : sessionResult && sessionResult.endTime > 0 ? (
              /* Session Results Screen */
              <StudySummary
                result={sessionResult}
                onRestartSession={() => handleStartStudySession(activeStudyMode, sessionCards)}
                onStartWeakSession={(weakCards) => handleStartStudySession('flashcard', weakCards)}
                onGoHome={() => {
                  setSessionResult(null);
                  setCurrentView('study');
                }}
                onGoToWordList={() => {
                  setSessionResult(null);
                  setCurrentView('wordList');
                }}
                onGoToDeckManager={() => {
                  setSessionResult(null);
                  setCurrentView('deckManager');
                }}
              />
            ) : (
              /* Main Study Setup Dashboard */
              <div className="space-y-6">
                
                {/* Today's Deck Progress Quick Switcher Bar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        📅
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">
                        今日の学習状況
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {studiedTodayDecksCount} / {decks.length} 冊 完了
                      </span>
                    </div>

                    <button
                      id="btn-switch-to-deck-manager"
                      onClick={() => setCurrentView('deckManager')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>単語帳一覧・管理へ</span>
                    </button>
                  </div>

                  {/* Horizontal Scrollable/Wrap Deck Status Quick Selection Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {allDeckStatuses.map(({ deck, status }) => {
                      const isCurrent = deck.id === activeDeckId;
                      return (
                        <button
                          key={deck.id}
                          id={`quick-deck-btn-${deck.id}`}
                          onClick={() => setActiveDeckId(deck.id)}
                          className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                              : status.isStudiedToday
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{status.allMastered ? '🏆' : status.isStudiedToday ? '✅' : '⏳'}</span>
                          <span className="max-w-[130px] truncate">{deck.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isCurrent 
                              ? 'bg-white/20 text-white' 
                              : status.isStudiedToday 
                              ? 'bg-emerald-200 text-emerald-900' 
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {status.isStudiedToday ? '済' : `${status.dueCount}語`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hero Feature Banner - Quick Start / Prominent Import */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10 max-w-2xl space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>忘却曲線アルゴリズム (SRS) による科学的記憶管理</span>
                      </div>

                      {/* Today Study Status Tag */}
                      {activeDeckStatus && (
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
                            activeDeckStatus.isStudiedToday
                              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                              : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                          }`}
                        >
                          <span>{activeDeckStatus.isStudiedToday ? '✅' : '⏳'}</span>
                          <span>
                            {activeDeckStatus.isStudiedToday
                              ? `本日学習済み (${activeDeckStatus.studiedTodayCount > 0 ? `今日${activeDeckStatus.studiedTodayCount}語復習` : '完了'})`
                              : `今日まだやっていません (復習目安: ${dueCount}語)`}
                          </span>
                        </div>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                      {activeDeck.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
                      {activeDeck.description || '自作の単語リストを一括インポートして、めくり学習や4択クイズで効率よく暗記しましょう。'}
                    </p>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        id="btn-hero-start-study"
                        onClick={() => handleStartStudySession('flashcard')}
                        disabled={currentDeckWords.length === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-900 font-extrabold text-sm shadow-lg hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>今すぐ暗記を始める</span>
                      </button>

                      <button
                        id="btn-hero-bulk-import"
                        onClick={() => setIsImportOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600/60 hover:bg-indigo-600 active:scale-95 text-white font-bold text-sm border border-indigo-400/30 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>単語を一括インポート</span>
                      </button>
                    </div>
                  </div>

                  {/* Right side stats badge on desktop */}
                  <div className="hidden lg:flex flex-col justify-center items-end absolute right-8 top-1/2 -translate-y-1/2 space-y-2">
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-right min-w-[200px]">
                      <div className="text-xs text-indigo-200 font-medium">登録単語数</div>
                      <div className="text-3xl font-black text-white">{currentDeckWords.length} <span className="text-sm font-normal text-indigo-300">語</span></div>
                      <div className="text-[11px] text-emerald-300 mt-1 flex items-center justify-end gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>完全習得: {masteredCount} 語</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leitner Box / Memory Stage Breakdown Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      記憶の定着ステージ (忘却曲線ボックス)
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      今日復習すべき単語: <strong className="text-indigo-600">{dueCount}</strong> 語
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {([0, 1, 2, 3, 4] as MasteryLevel[]).map((level) => {
                      const count = currentDeckWords.filter((w) => w.masteryLevel === level).length;
                      const info = MASTERY_LABELS[level];

                      return (
                        <div
                          key={level}
                          className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${info.bg} ${info.color} border ${info.border}`}>
                                {info.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {info.sub}
                              </span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                              {count}
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all"
                              style={{ width: `${(count / (currentDeckWords.length || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5 Specialized Memorization Modes Selection */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    暗記学習モードの選択
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* 1. Flashcard Mode */}
                    <div
                      id="card-mode-flashcard"
                      onClick={() => handleStartStudySession('flashcard')}
                      className="bg-white rounded-3xl border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md p-5 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">
                          フラッシュカード
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          3Dフリップで表裏をめくり、定着度（まだ / 覚えた / 完璧）を即座に判定する王道暗記。
                        </p>
                      </div>
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>学習を始める</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>

                    {/* 2. Tap Reveal Card Mode (新機能: 意味隠し・タップ開示 & 4段階評価) */}
                    <div
                      id="card-mode-reveal"
                      onClick={() => handleStartStudySession('reveal')}
                      className="bg-white rounded-3xl border-2 border-indigo-200 hover:border-indigo-600 hover:shadow-lg p-5 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden bg-gradient-to-b from-indigo-50/30 to-white"
                    >
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                        おすすめ
                      </div>
                      <div className="space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Eye className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">
                          タップ開示カード
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          単語と隠された意味が表示され、タップで意味を即座に開示。4段階評価でスピーディーに暗記。
                        </p>
                      </div>
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>タップ学習を始める</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>

                    {/* 3. Memorization Sheet Mode (単語一覧 暗記シート) */}
                    <div
                      id="card-mode-sheet"
                      onClick={() => handleStartStudySession('sheet')}
                      className="bg-white rounded-3xl border-2 border-slate-200 hover:border-rose-400 hover:shadow-md p-5 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ListOrdered className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">
                          単語一覧 暗記シート
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          日本語が隠された一覧シート。タップで意味を確認し、チェックで「完璧」に分類。
                        </p>
                      </div>
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>シートを開く</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>

                    {/* 3. 4-Choice Quiz Mode */}
                    <div
                      id="card-mode-quiz"
                      onClick={() => handleStartStudySession('quiz')}
                      className="bg-white rounded-3xl border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md p-5 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">
                          4択クイズテスト
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          自動生成の選択肢から素早く解答。タイマー機能と連勝コンボで楽しくアウトプット。
                        </p>
                      </div>
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>テストを開始</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>

                    {/* 4. Typing / Spell Test Mode */}
                    <div
                      id="card-mode-typing"
                      onClick={() => handleStartStudySession('typing')}
                      className="bg-white rounded-3xl border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md p-5 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">
                          タイピング・スペル
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          意味を見て正確にスペルを入力。曖昧な記憶を完全に定着させたい時に最適。
                        </p>
                      </div>
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>入力を開始</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>

                    {/* 5. Speed Audio Review */}
                    <div
                      id="card-mode-speed"
                      onClick={() => handleStartStudySession('speed')}
                      className="bg-white rounded-3xl border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md p-5 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">
                          高速自動送り・音読
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          「〇〇は〇〇という意味です」の連続再生。通勤中や手を使えない時の聞き流しに。
                        </p>
                      </div>
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>自動再生を開始</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Session Scope & Settings Filter Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    出題設定・絞り込みオプション
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    
                    {/* Scope */}
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">出題範囲:</label>
                      <select
                        value={studyFilterScope}
                        onChange={(e) => setStudyFilterScope(e.target.value as typeof studyFilterScope)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="all">全単語 ({currentDeckWords.length} 語)</option>
                        <option value="due">今日復習すべき単語 ({dueCount} 語)</option>
                        <option value="weak">苦手・星マークのみ ({weakCount} 語)</option>
                        <option value="unlearned">未学習のみ ({unlearnedCount} 語)</option>
                      </select>
                    </div>

                    {/* Batch Size */}
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">1回の学習枚数:</label>
                      <select
                        value={studyBatchSize}
                        onChange={(e) => setStudyBatchSize(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value={10}>10 語 (スキマ時間)</option>
                        <option value={20}>20 語 (標準)</option>
                        <option value={50}>50 語 (集中)</option>
                        <option value={0}>全単語まとめて</option>
                      </select>
                    </div>

                    {/* Shuffle toggle */}
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">出題順序:</label>
                      <button
                        type="button"
                        onClick={() => setIsShuffled((p) => !p)}
                        className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                          isShuffled
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Shuffle className="w-4 h-4" />
                        <span>{isShuffled ? 'ランダムシャッフル' : '登録順'}</span>
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW 2: WORD LIST TABLE */}
        {currentView === 'wordList' && (
          <WordList
            words={words}
            activeDeck={activeDeck}
            onEditWord={(card) => {
              setEditingWord(card);
              setIsWordEditOpen(true);
            }}
            onDeleteWord={handleDeleteWord}
            onBulkDelete={handleBulkDelete}
            onBulkResetProgress={handleBulkResetProgress}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddWord={() => {
              setEditingWord(null);
              setIsWordEditOpen(true);
            }}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            onDeleteDeck={handleDeleteDeck}
            decksCount={decks.length}
            onUpdateCardMastery={(card, newLevel) => {
              setWords((prev) =>
                prev.map((w) =>
                  w.id === card.id
                    ? {
                        ...w,
                        masteryLevel: newLevel,
                        reviewCount: w.reviewCount + 1,
                        correctCount: newLevel === 4 ? w.correctCount + 1 : w.correctCount,
                        lastReviewedAt: Date.now(),
                      }
                    : w
                )
              );
            }}
            onStartMemorizeSheet={() => handleStartStudySession('sheet')}
          />
        )}

        {/* VIEW 3: DECK MANAGER */}
        {currentView === 'deckManager' && (
          <DeckManager
            decks={decks}
            activeDeckId={activeDeckId}
            onSelectDeck={(id) => {
              setActiveDeckId(id);
              setCurrentView('study');
            }}
            onCreateDeck={handleCreateDeck}
            onUpdateDeck={handleUpdateDeck}
            onDeleteDeck={handleDeleteDeck}
            words={words}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenExport={(deckId) => {
              setActiveDeckId(deckId);
              setIsExportOpen(true);
            }}
            onStartStudy={(deckId) => {
              setActiveDeckId(deckId);
              setCurrentView('study');
              handleStartStudySession('flashcard');
            }}
          />
        )}

      </main>

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        decks={decks}
        activeDeckId={activeDeckId}
        onImportWords={handleImportWords}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        deck={activeDeck}
        words={words}
      />

      <WordEditModal
        isOpen={isWordEditOpen}
        onClose={() => setIsWordEditOpen(false)}
        onSave={handleSaveWord}
        initialData={editingWord}
        decks={decks}
        currentDeckId={activeDeckId}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetAllData={handleResetAllData}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onResetToSampleData={handleResetAllData}
        onResetProgressOnly={handleResetProgressOnly}
        onClearAllData={handleClearAllData}
      />

      {/* Subtle Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>暗記特化 単語帳 Pro — Spaced Repetition Flashcard System</span>
          <div className="flex items-center gap-3 text-slate-500">
            <button onClick={() => setIsShortcutsOpen(true)} className="hover:text-indigo-600">ショートカット一覧</button>
            <span>•</span>
            <button onClick={() => setIsImportOpen(true)} className="hover:text-indigo-600 font-semibold">一括インポート</button>
            <span>•</span>
            <button onClick={() => setIsResetOpen(true)} className="hover:text-rose-600">データの初期化</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
