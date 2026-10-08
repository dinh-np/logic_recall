import { diffWords } from 'diff';
import type { Change } from 'diff';

export interface DiffResult {
  accuracy: number;
  changes: Change[];
  missingKeywords: string[];
}

const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[.,;!?(){}[\]"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const compareText = (originalText: string, transcribedText: string, keywordsLevel2: string[] = []): DiffResult => {
  const oldStr = normalizeText(originalText);
  const newStr = normalizeText(transcribedText);
  
  const changes = diffWords(oldStr, newStr, { ignoreCase: true });

  let totalWords = 0;
  let correctWords = 0;

  changes.forEach(part => {
    const wordCount = part.value.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (!part.added && !part.removed) {
      totalWords += wordCount;
      correctWords += wordCount;
    } else if (part.removed) {
      totalWords += wordCount;
    }
  });

  const accuracy = totalWords === 0 ? 0 : Math.round((correctWords / totalWords) * 100);

  const missingKeywords = keywordsLevel2.filter(kw => {
    const kwNormalized = normalizeText(kw);
    return !newStr.includes(kwNormalized);
  });

  return {
    accuracy,
    changes,
    missingKeywords
  };
};
