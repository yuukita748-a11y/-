import { LanguageCode, SUPPORTED_LANGUAGES } from '../types';

/**
 * Sound effects and speech synthesis for memorization
 */

// Web Audio API Synthesizer
class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a crisp pleasant chime for correct answers
  playCorrect() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  // Subtle soft buzzer for incorrect
  playIncorrect() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  // Tactile flip sound
  playFlip() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.07);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // ignore
    }
  }

  // Mastered fanfare chime
  playMastered() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundManager();

// Cache available speech synthesis voices
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

/**
 * Detect language from text content if not explicitly specified
 */
export const detectLanguageFromText = (text: string): LanguageCode => {
  const clean = text.trim();
  if (!clean) return 'en';

  // Japanese check (Hiragana, Katakana, CJK Unified Ideographs)
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(clean)) {
    return 'ja';
  }

  // German specific characters (Umlauts ä, ö, ü and Eszett ß)
  if (/[äöüßÄÖÜ]/.test(clean) || /\b(der|die|das|und|nicht|ein|eine|einen|einem|einer|eines|mit|auf|für|von|zu|ist|sind|werden|haben|können|gut|schön|bitte|danke)\b/i.test(clean)) {
    return 'de';
  }

  // French specific characters (accents é, è, ê, à, â, ç, î, ï, ô, ù, û, œ, æ, apostrophe l', d', qu')
  if (/[éèêëàâçîïôùûœæÉÈÊËÀÂÇÎÏÔÙÛŒÆ]/.test(clean) || /\b(le|la|les|un|une|des|et|du|au|aux|dans|pour|sur|avec|est|sont|être|avoir|faire|que|qui|ce|cette|ces|bonjour|merci)\b/i.test(clean) || /(?:^|\s)[ldjsmnct]'/i.test(clean)) {
    return 'fr';
  }

  return 'en';
};

/**
 * Clean text for TTS (strip phonetic brackets, slashes, notes)
 */
export const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/\/.*?\/|\[.*?\]/g, '') // remove phonetic notation /.../ or [...]
    .replace(/\(.*?\)|（.*?）/g, '') // remove parenthetical notes
    .trim();
};

/**
 * Get matching voice for language
 */
const getBestVoiceForLang = (langTag: string): SpeechSynthesisVoice | undefined => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  
  if (!cachedVoices.length) {
    cachedVoices = window.speechSynthesis.getVoices();
  }

  const tagLower = langTag.toLowerCase().replace('_', '-');
  const langPrefix = tagLower.split('-')[0];

  // 1. Exact match (e.g. 'de-de', 'fr-fr', 'ja-jp', 'en-us')
  const exact = cachedVoices.find((v) => v.lang.toLowerCase().replace('_', '-') === tagLower);
  if (exact) return exact;

  // 2. Prefix match (e.g. starts with 'de', 'fr', 'ja', 'en')
  const prefixMatch = cachedVoices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix));
  if (prefixMatch) return prefixMatch;

  return undefined;
};

/**
 * Stop any ongoing speech
 */
export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Text to speech for pronunciation (supports English, German, French, Japanese)
 */
export const speakWord = (
  text: string, 
  langHint?: string | LanguageCode,
  onEnd?: () => void
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Determine target BCP 47 language tag
    let targetLang = 'en-US';

    if (langHint && langHint !== 'auto') {
      if (langHint === 'de' || langHint.startsWith('de')) {
        targetLang = 'de-DE';
      } else if (langHint === 'fr' || langHint.startsWith('fr')) {
        targetLang = 'fr-FR';
      } else if (langHint === 'ja' || langHint.startsWith('ja')) {
        targetLang = 'ja-JP';
      } else if (langHint === 'en' || langHint.startsWith('en')) {
        targetLang = 'en-US';
      } else {
        targetLang = langHint;
      }
    } else {
      const detected = detectLanguageFromText(cleanText);
      targetLang = SUPPORTED_LANGUAGES[detected]?.ttsLang || 'en-US';
    }

    utterance.lang = targetLang;

    // Pick best matching system voice if available
    const matchedVoice = getBestVoiceForLang(targetLang);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    // Natural speech rate
    if (targetLang.startsWith('ja')) {
      utterance.rate = 1.0;
    } else if (targetLang.startsWith('de') || targetLang.startsWith('fr')) {
      utterance.rate = 0.9;
    } else {
      utterance.rate = 0.95;
    }
    
    utterance.pitch = 1.0;
    
    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
    onEnd?.();
  }
};

/**
 * Sequential 2-cycle reading for Auto Speed Review:
 * Speaks [Word] in target language, then [Meaning] in Japanese,
 * and repeats it for a total of 2 times in succession.
 * Sequence: Word (1st) -> Meaning (1st) -> Word (2nd) -> Meaning (2nd)
 */
export const speakWordAndMeaningTwice = (
  word: string,
  meaning: string,
  wordLang: LanguageCode | string = 'en',
  onStepChange?: (stepIndex: number) => void,
  onComplete?: () => void
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onComplete?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const cleanWord = cleanTextForSpeech(word);
    const cleanMeaning = cleanTextForSpeech(meaning);

    if (!cleanWord) {
      onComplete?.();
      return;
    }

    let targetWordLang = 'en-US';
    if (wordLang === 'de' || wordLang.startsWith('de')) targetWordLang = 'de-DE';
    else if (wordLang === 'fr' || wordLang.startsWith('fr')) targetWordLang = 'fr-FR';
    else if (wordLang === 'ja' || wordLang.startsWith('ja')) targetWordLang = 'ja-JP';
    else if (wordLang === 'en' || wordLang.startsWith('en')) targetWordLang = 'en-US';
    else {
      const detected = detectLanguageFromText(cleanWord);
      targetWordLang = SUPPORTED_LANGUAGES[detected]?.ttsLang || 'en-US';
    }

    const wordVoice = getBestVoiceForLang(targetWordLang);
    const jaVoice = getBestVoiceForLang('ja-JP');

    const makeWordUtterance = () => {
      const u = new SpeechSynthesisUtterance(cleanWord);
      u.lang = targetWordLang;
      if (wordVoice) u.voice = wordVoice;
      u.rate = targetWordLang.startsWith('de') || targetWordLang.startsWith('fr') ? 0.9 : 0.95;
      return u;
    };

    const makeMeaningUtterance = () => {
      if (!cleanMeaning) return null;
      const u = new SpeechSynthesisUtterance(cleanMeaning);
      u.lang = 'ja-JP';
      if (jaVoice) u.voice = jaVoice;
      u.rate = 1.0;
      return u;
    };

    // 1st cycle: Word 1 -> Meaning 1
    // 2nd cycle: Word 2 -> Meaning 2
    const w1 = makeWordUtterance();
    const m1 = makeMeaningUtterance();
    const w2 = makeWordUtterance();
    const m2 = makeMeaningUtterance();

    let isAborted = false;

    w1.onend = () => {
      if (isAborted) return;
      if (m1) {
        onStepChange?.(1);
        setTimeout(() => {
          if (!isAborted) window.speechSynthesis.speak(m1);
        }, 180);
      } else {
        onStepChange?.(2);
        setTimeout(() => {
          if (!isAborted) window.speechSynthesis.speak(w2);
        }, 220);
      }
    };
    w1.onerror = () => {
      if (m1) {
        onStepChange?.(1);
        window.speechSynthesis.speak(m1);
      } else {
        onStepChange?.(2);
        window.speechSynthesis.speak(w2);
      }
    };

    if (m1) {
      m1.onend = () => {
        if (isAborted) return;
        onStepChange?.(2);
        setTimeout(() => {
          if (!isAborted) window.speechSynthesis.speak(w2);
        }, 220);
      };
      m1.onerror = () => {
        onStepChange?.(2);
        window.speechSynthesis.speak(w2);
      };
    }

    w2.onend = () => {
      if (isAborted) return;
      if (m2) {
        onStepChange?.(3);
        setTimeout(() => {
          if (!isAborted) window.speechSynthesis.speak(m2);
        }, 180);
      } else {
        onStepChange?.(4);
        onComplete?.();
      }
    };
    w2.onerror = () => {
      if (m2) {
        onStepChange?.(3);
        window.speechSynthesis.speak(m2);
      } else {
        onStepChange?.(4);
        onComplete?.();
      }
    };

    if (m2) {
      m2.onend = () => {
        if (isAborted) return;
        onStepChange?.(4);
        onComplete?.();
      };
      m2.onerror = () => {
        onStepChange?.(4);
        onComplete?.();
      };
    }

    onStepChange?.(0);
    window.speechSynthesis.speak(w1);
  } catch (e) {
    console.warn('speakWordAndMeaningTwice error:', e);
    onComplete?.();
  }
};

/**
 * Sequential reading for Auto Speed Review:
 * Speaks [Word] in target language, then [Meaning] in Japanese once.
 */
export const speakWordAndMeaning = (
  word: string,
  meaning: string,
  wordLang: LanguageCode | string = 'en',
  onComplete?: () => void
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onComplete?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const cleanWord = cleanTextForSpeech(word);
    const cleanMeaning = cleanTextForSpeech(meaning);

    if (!cleanWord) {
      onComplete?.();
      return;
    }

    const wordUtterance = new SpeechSynthesisUtterance(cleanWord);
    let targetWordLang = 'en-US';
    if (wordLang === 'de' || wordLang.startsWith('de')) targetWordLang = 'de-DE';
    else if (wordLang === 'fr' || wordLang.startsWith('fr')) targetWordLang = 'fr-FR';
    else if (wordLang === 'ja' || wordLang.startsWith('ja')) targetWordLang = 'ja-JP';
    else if (wordLang === 'en' || wordLang.startsWith('en')) targetWordLang = 'en-US';
    else {
      const detected = detectLanguageFromText(cleanWord);
      targetWordLang = SUPPORTED_LANGUAGES[detected]?.ttsLang || 'en-US';
    }

    wordUtterance.lang = targetWordLang;
    const wordVoice = getBestVoiceForLang(targetWordLang);
    if (wordVoice) wordUtterance.voice = wordVoice;
    wordUtterance.rate = targetWordLang.startsWith('de') || targetWordLang.startsWith('fr') ? 0.9 : 0.95;

    if (!cleanMeaning) {
      wordUtterance.onend = () => onComplete?.();
      wordUtterance.onerror = () => onComplete?.();
      window.speechSynthesis.speak(wordUtterance);
      return;
    }

    const meaningUtterance = new SpeechSynthesisUtterance(cleanMeaning);
    meaningUtterance.lang = 'ja-JP';
    const jaVoice = getBestVoiceForLang('ja-JP');
    if (jaVoice) meaningUtterance.voice = jaVoice;
    meaningUtterance.rate = 1.0;

    wordUtterance.onend = () => {
      setTimeout(() => {
        window.speechSynthesis.speak(meaningUtterance);
      }, 180);
    };
    wordUtterance.onerror = () => {
      window.speechSynthesis.speak(meaningUtterance);
    };

    meaningUtterance.onend = () => {
      onComplete?.();
    };
    meaningUtterance.onerror = () => {
      onComplete?.();
    };

    window.speechSynthesis.speak(wordUtterance);
  } catch (e) {
    console.warn('speakWordAndMeaning error:', e);
    onComplete?.();
  }
};
