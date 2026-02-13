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
      />

      {/* Toast 通知 */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">保存成功</span>
          </div>
        </div>
      )}
    </>
  );
}

