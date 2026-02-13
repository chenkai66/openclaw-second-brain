'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tag {
  tag: string;
  count: number;
}

interface TagFilterProps {
  onFilterChange?: (selectedTags: string[]) => void;
}

export default function TagFilter({ onFilterChange }: TagFilterProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    onFilterChange?.(selectedTags);
  }, [selectedTags, onFilterChange]);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags?limit=50');
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  const displayTags = showAll ? tags : tags.slice(0, 12);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          标签筛选
        </h3>
        {selectedTags.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            清除筛选
          </button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">已选择:</span>
            {selectedTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                #{tag}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {displayTags.map(({ tag, count }) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>#{tag}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isSelected
                  ? 'bg-indigo-200 dark:bg-indigo-800'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tags.length > 12 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center justify-center gap-1"
        >
          {showAll ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              收起
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              显示全部 ({tags.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}

