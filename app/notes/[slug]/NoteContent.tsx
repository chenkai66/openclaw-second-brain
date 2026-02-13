'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';

interface NoteContentProps {
  slug: string;
  initialContent: string;
  tags: string[];
}

export default function NoteContent({ slug, initialContent, tags }: NoteContentProps) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  
  // 检查是否为开发环境
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleSave = async (content: string) => {
    try {
      const response = await fetch(`/api/notes/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          tags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      // 显示成功提示
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // 刷新页面数据
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

  return (
    <>
      <MarkdownEditor 
        initialContent={initialContent}
        onSave={handleSave}
        readOnly={!isDevelopment}
      />

      {/* 生产环境提示 */}
      {!isDevelopment && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Read-only mode
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Editing is disabled in production environment for security reasons.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Saved successfully</span>
          </div>
        </div>
      )}
    </>
  );
}

