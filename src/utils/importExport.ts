import { WordCard, ImportPreviewRow, LanguageCode, WordGender } from '../types';
import { detectGenderFromContent } from './gender';

export interface ParseResult {
  rows: ImportPreviewRow[];
  detectedDelimiter: string;
  totalLines: number;
  validCount: number;
  invalidCount: number;
  sampleHeaders: string[];
  rawColumnsPreview: string[][];
}

/**
 * Normalize language string to valid LanguageCode
 */
export const normalizeLanguageCode = (val?: string): LanguageCode | undefined => {
  if (!val) return undefined;
  const s = val.trim().toLowerCase();
  if (s === 'en' || s === 'eng' || s === 'english' || s.includes('英語')) return 'en';
  if (s === 'de' || s === 'deu' || s === 'ger' || s === 'german' || s === 'deutsch' || s.includes('ドイツ')) return 'de';
  if (s === 'fr' || s === 'fra' || s === 'fre' || s === 'french' || s === 'français' || s === 'francais' || s.includes('フランス')) return 'fr';
  if (s === 'ja' || s === 'jp' || s === 'jpn' || s === 'japanese' || s.includes('日本')) return 'ja';
  if (s === 'auto' || s.includes('自動')) return 'auto';
  return undefined;
};

/**
 * Detect best delimiter from raw text
 */
export const detectDelimiter = (text: string): string => {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return '\t';

  let tabCount = 0;
  let commaCount = 0;
  let colonCount = 0;
  let arrowCount = 0;
  let pipeCount = 0;

  for (const line of lines) {
    if (line.includes('\t')) tabCount++;
    if (line.includes(',')) commaCount++;
    if (line.includes(' : ') || line.includes(':')) colonCount++;
    if (line.includes(' -> ') || line.includes(' - ')) arrowCount++;
    if (line.includes('|')) pipeCount++;
  }

  if (tabCount >= 2) return '\t';
  if (commaCount >= 2) return ',';
  if (pipeCount >= 2) return '|';
  if (colonCount >= 2) return ':';
  if (arrowCount >= 2) return '-';

  return '\t';
};

/**
 * Split a CSV line respecting quotes
 */
export const parseCsvLine = (line: string, delimiter: string): string[] => {
  if (delimiter === '\t') {
    return line.split('\t').map(s => s.trim().replace(/^["']|["']$/g, ''));
  }
  if (delimiter === '|') {
    return line.split('|').map(s => s.trim().replace(/^["']|["']$/g, ''));
  }
  if (delimiter === ':') {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }
    return [line.trim()];
  }
  if (delimiter === '-') {
    const match = line.match(/^(.+?)(?:\s*->\s*|\s*=>\s*|\s*-\s*|\s*—\s*)(.+)$/);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
    return [line.trim()];
  }

  // Standard CSV with quotes parser
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
};

/**
 * Parse raw text into structured preview rows
 */
export const parseImportText = (
  rawText: string,
  options: {
    delimiter?: string;
    hasHeader?: boolean;
    colWord?: number;
    colMeaning?: number;
    colLanguage?: number;
    colReading?: number;
    colExample?: number;
    colNote?: number;
    colTags?: number;
    defaultLanguage?: LanguageCode;
  } = {}
): ParseResult => {
  const cleanText = rawText.trim();
  if (!cleanText) {
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

  const defaultLang = options.defaultLanguage || 'en';

  // Check if it's JSON
  if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
    try {
      const parsedJson = JSON.parse(cleanText);
      if (Array.isArray(parsedJson)) {
        const rows: ImportPreviewRow[] = parsedJson.map((item) => {
          const word = String(item.word || item.front || item.question || item.term || '').trim();
          const meaning = String(item.meaning || item.back || item.answer || item.definition || '').trim();
          const language = normalizeLanguageCode(item.language || item.lang) || defaultLang;
          const reading = item.reading || item.phonetic || item.kana || undefined;
          const example = item.example || undefined;
          const note = item.note || item.comment || undefined;
          const tags = Array.isArray(item.tags)
            ? item.tags.map(String)
            : typeof item.tags === 'string'
            ? item.tags.split(/[,、\s]+/).filter(Boolean)
            : undefined;
          const gender: WordGender = (item.gender === 'masculine' || item.gender === 'feminine' || item.gender === 'neuter' || item.gender === 'none')
            ? item.gender
            : detectGenderFromContent(word, tags, note, language);

          const isValid = word.length > 0 && meaning.length > 0;
          return {
            word,
            meaning,
            language,
            reading,
            example,
            note,
            tags,
            gender,
            isValid,
            error: !word ? '単語が空です' : !meaning ? '意味が空です' : undefined,
          };
        });

        return {
          rows,
          detectedDelimiter: 'json',
          totalLines: parsedJson.length,
          validCount: rows.filter((r) => r.isValid).length,
          invalidCount: rows.filter((r) => !r.isValid).length,
          sampleHeaders: ['word', 'meaning', 'language', 'reading', 'example', 'note', 'tags'],
          rawColumnsPreview: rows.slice(0, 5).map(r => [r.word, r.meaning, r.reading || '', r.example || '']),
        };
      }
    } catch {
      // Fallback to line by line if JSON parsing failed
    }
  }

  const delimiter = options.delimiter || detectDelimiter(cleanText);
  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0);

  const rawColumns: string[][] = lines.map((l) => parseCsvLine(l, delimiter));
  const hasHeader = options.hasHeader ?? false;
  const dataRows = hasHeader ? rawColumns.slice(1) : rawColumns;

  // Max columns found in data
  const maxCols = Math.max(...rawColumns.map((c) => c.length), 2);
  const sampleHeaders = hasHeader && rawColumns.length > 0
    ? rawColumns[0]
    : Array.from({ length: maxCols }, (_, i) => `列 ${i + 1}`);

  const colWord = options.colWord ?? 0;
  const colMeaning = options.colMeaning ?? 1;
  const colLanguage = options.colLanguage ?? -1;
  const colReading = options.colReading ?? (maxCols > 2 && colLanguage !== 2 ? 2 : -1);
  const colExample = options.colExample ?? (maxCols > 3 ? 3 : -1);
  const colNote = options.colNote ?? (maxCols > 4 ? 4 : -1);
  const colTags = options.colTags ?? (maxCols > 5 ? 5 : -1);

  const previewRows: ImportPreviewRow[] = dataRows.map((cols) => {
    const word = (cols[colWord] || '').trim();
    const meaning = (cols[colMeaning] || '').trim();
    const langRaw = colLanguage >= 0 && cols[colLanguage] ? cols[colLanguage].trim() : '';
    const language = normalizeLanguageCode(langRaw) || defaultLang;
    const reading = colReading >= 0 && cols[colReading] ? cols[colReading].trim() : undefined;
    const example = colExample >= 0 && cols[colExample] ? cols[colExample].trim() : undefined;
    const note = colNote >= 0 && cols[colNote] ? cols[colNote].trim() : undefined;
    const tagsRaw = colTags >= 0 && cols[colTags] ? cols[colTags].trim() : '';
    const tags = tagsRaw ? tagsRaw.split(/[,、/;\s]+/).filter(Boolean) : undefined;

    const isValid = word.length > 0 && meaning.length > 0;
    const gender = detectGenderFromContent(word, tags, note, language);
    let error: string | undefined;
    if (!word && !meaning) {
      error = '単語と意味の両方が空です';
    } else if (!word) {
      error = '単語(表面)が空です';
    } else if (!meaning) {
      error = '意味(裏面)が空です';
    }

    return {
      word,
      meaning,
      language,
      reading,
      example,
      note,
      tags,
      gender,
      isValid,
      error,
    };
  });

  return {
    rows: previewRows,
    detectedDelimiter: delimiter,
    totalLines: dataRows.length,
    validCount: previewRows.filter((r) => r.isValid).length,
    invalidCount: previewRows.filter((r) => !r.isValid).length,
    sampleHeaders,
    rawColumnsPreview: rawColumns.slice(0, 5),
  };
};

/**
 * Export deck cards to CSV/TSV/JSON/TXT/WordsOnly
 */
export const exportCards = (
  cards: WordCard[],
  format: 'csv' | 'tsv' | 'json' | 'txt' | 'words_only',
  includeHeader: boolean = true
): string => {
  if (cards.length === 0) return '';

  if (format === 'words_only') {
    return cards.map((c) => c.word).join('\n');
  }

  if (format === 'json') {
    const exportData = cards.map((c) => ({
      word: c.word,
      meaning: c.meaning,
      reading: c.reading || '',
      example: c.example || '',
      exampleMeaning: c.exampleMeaning || '',
      note: c.note || '',
      tags: c.tags || [],
      gender: c.gender || 'none',
      masteryLevel: c.masteryLevel,
      reviewCount: c.reviewCount,
      isFavorite: c.isFavorite,
    }));
    return JSON.stringify(exportData, null, 2);
  }

  const delimiter = format === 'tsv' ? '\t' : format === 'txt' ? ' : ' : ',';
  const escapeCsv = (val: string) => {
    if (format === 'tsv' || format === 'txt') {
      return (val || '').replace(/\r?\n/g, ' ');
    }
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  if (format === 'txt') {
    return cards
      .map((c) => {
        let line = `${c.word} : ${c.meaning}`;
        if (c.reading) line += ` [${c.reading}]`;
        if (c.example) line += ` (${c.example})`;
        return line;
      })
      .join('\n');
  }

  const header = ['単語', '意味', '読み方・発音', '例文', 'メモ・解説', 'タグ'].join(delimiter);
  const rows = cards.map((c) => {
    return [
      escapeCsv(c.word),
      escapeCsv(c.meaning),
      escapeCsv(c.reading || ''),
      escapeCsv(c.example || ''),
      escapeCsv(c.note || ''),
      escapeCsv((c.tags || []).join(' ')),
    ].join(delimiter);
  });

  if (!includeHeader) {
    return rows.join('\n');
  }

  return [header, ...rows].join('\n');
};

/**
 * Trigger browser file download
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
