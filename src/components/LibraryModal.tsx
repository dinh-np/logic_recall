import React, { useState, useEffect } from 'react';
import { X, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { getLessonsFromFirestore, deleteLessonFromFirestore } from '../services/firebase';
import type { SavedLesson } from '../types/index';

interface LibraryModalProps {
  onClose: () => void;
  onOpenLesson: (lesson: SavedLesson) => void;
}

const ALL_SUBJECTS = ['Tất cả', 'GDCD', 'Lịch Sử', 'Địa Lý', 'KHTN', 'Công nghệ', 'Ngữ văn', 'Other'] as const;
type FilterTab = typeof ALL_SUBJECTS[number];

export const LibraryModal: React.FC<LibraryModalProps> = ({ onClose, onOpenLesson }) => {
  const [lessons, setLessons] = useState<SavedLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('Tất cả');

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const data = await getLessonsFromFirestore(filter);
      setLessons(data);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
    try {
      await deleteLessonFromFirestore(id);
      setLessons(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-krones-navy flex items-center gap-2">
            <FolderOpen className="text-krones-blue" />
            Thư viện bài học
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto whitespace-nowrap">
          {ALL_SUBJECTS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                filter === tab 
                  ? 'bg-krones-navy text-white' 
                  : 'bg-krones-ice text-krones-navy hover:bg-krones-blue hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-krones-blue" size={48} />
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FolderOpen size={64} className="mb-4 opacity-50" />
              <p className="text-lg">Không có bài học nào trong thư viện.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {lessons.map(lesson => (
                <div key={lesson.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-krones-ice text-krones-navy text-xs font-bold rounded-full">
                      {lesson.subject}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(lesson.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex-1 line-clamp-2" title={lesson.title}>
                    {lesson.title || 'Bài học không tên'}
                  </h3>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => onOpenLesson(lesson)}
                      className="flex-1 px-4 py-2 bg-krones-blue text-white rounded font-medium hover:bg-krones-navy transition-colors text-sm"
                    >
                      Mở bài này
                    </button>
                    <button 
                      onClick={() => lesson.id && handleDelete(lesson.id)}
                      className="p-2 text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors"
                      title="Xóa bài"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
