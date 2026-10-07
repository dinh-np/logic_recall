export type Subject = 'GDCD' | 'Lịch Sử' | 'Địa Lý' | 'Khác';

export interface HanVietTerm {
  word: string;
  rootMeaning: string;
  logicalAnchor: string;
}

export interface Lesson {
  id: string;
  userId: string;
  subject: Subject;
  title: string;
  originalText: string;
  formulaExpression?: string;
  hanVietList: HanVietTerm[];
  keywordsManual: string[];
  keywordsAiLevel1: string[];
  keywordsAiLevel2: string[];
  createdAt: number;
}
