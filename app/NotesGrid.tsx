'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import TagFilter from '@/components/TagFilter';

interface Note {
  slug: string;
  content: string;
  metadata: {
    title?: string;
    created?: string;
    summary?: string;
    tags?: string[];
  };
}

interface NotesGridProps {
  notes: Note[];
}

export default function NotesGrid({ notes }: NotesGridProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 根据选中的标签筛选笔记
  const filteredNotes = useMemo(() => {
    if (selectedTags.length === 0) {
      return notes;
    }

    return notes.filter(note => {
      const noteTags = note.metadata.tags || [];
      return selectedTags.some(selectedTag => 
        noteTags.some(noteTag => 
          noteTag.toLowerCase().includes(selectedTag.toLowerCase())
        )
      );
    });
  }, [notes, selectedTags]);

  return (
    <>
      {/* Notes Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">概念笔记</h2>
            <p className="text-gray-600 dark:text-gray-400">
              AI 自动提取的核心概念与知识点
              {selectedTags.length > 0 && (
                <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                  · 筛选结果: {filteredNotes.length} / {notes.length}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 标签筛选 */}
        <div className="mb-8">
          <TagFilter onFilterChange={setSelectedTags} />
        </div>
        
        {notes.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">暂无笔记，开始对话后将自动生成</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">没有找到匹配的笔记</p>
            <button
              onClick={() => setSelectedTags([])}
              className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredNotes.map((note, index) => (
              <Link 
                key={note.slug} 
                href={`/notes/${note.slug}`}
                className="group block"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {note.metadata.title || note.slug}
                    </h3>
                    <span className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                      笔记
                    </span>
                  </div>
                  
                  {note.metadata.created && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {note.metadata.created}
                    </p>
                  )}
                  
                  {note.metadata.summary && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                      {note.metadata.summary}
                    </p>
                  )}
                  
                  {note.metadata.tags && note.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.metadata.tags.slice(0, 4).map((tag: string) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <span 
                            key={tag} 
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                              isSelected
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            #{tag}
                          </span>
                        );
                      })}
                      {note.metadata.tags.length > 4 && (
                        <span className="text-xs px-2.5 py-1 text-gray-500 dark:text-gray-400">
                          +{note.metadata.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

