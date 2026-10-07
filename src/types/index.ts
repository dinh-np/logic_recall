export type Subject = 'GDCD' | 'Lịch Sử' | 'Địa Lý' | 'KHTN' | 'Công nghệ' | 'Ngữ văn' | 'Other';

export interface SavedLesson {
  id?: string;
  title: string;
  subject: Subject;
  originalText: string;
  formulaSummary: string;
  hanVietDictionary: Array<{
    word: string;
    rootMeaning: string;
    logicalAnchor: string;
  }>;
  keywordsLevel1: string[];
  keywordsLevel2: string[];
  createdAt: number;
}
