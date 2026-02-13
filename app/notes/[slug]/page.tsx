import { notFound } from 'next/navigation';
import { ContentManager } from '@/lib/content-manager';
import Link from 'next/link';
import NoteContent from './NoteContent';

// 启用增量静态生成
export const revalidate = 60;

// 生成静态参数
export async function generateStaticParams() {
  const contentManager = new ContentManager();
  const notes = await contentManager.getAllNotes();
  
  return notes.map((note) => ({
    slug: note.slug,
  }));
}

interface NotePageProps {
  params: {
    slug: string;
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = params;
  const contentManager = new ContentManager();
  
  // Check if note exists
  const noteExists = await contentManager.noteExists(slug);
  if (!noteExists) {
    notFound();
  }
  
  const noteContent = await contentManager.getNote(slug);
  const allNotes = await contentManager.getAllNotes();
  const note = allNotes.find(n => n.slug === slug);
  
  if (!note) {
    notFound();
  }
  
  // Extract content without frontmatter
  const contentWithoutFrontmatter = noteContent.replace(/^---\n[\s\S]*?\n---\n/, '');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 group"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      {/* Note header */}
      <header className="mb-12">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">
              {note.metadata.title || slug}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {note.metadata.created && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  创建于 {note.metadata.created}
                </div>
              )}
              {note.metadata.updated && note.metadata.updated !== note.metadata.created && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  更新于 {note.metadata.updated}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {note.metadata.tags && note.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.metadata.tags.map((tag: string) => (
              <span 
                key={tag} 
                className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Note content */}
      <article className="mb-12 bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800">
        <NoteContent 
          slug={slug}
          initialContent={contentWithoutFrontmatter}
          tags={note.metadata.tags || []}
        />
      </article>

      {/* Related logs */}
      {note.metadata.related_logs && note.metadata.related_logs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">相关日志</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {note.metadata.related_logs.map((logDate: string) => (
              <Link 
                key={logDate} 
                href={`/logs/${logDate}`}
                className="group block p-5 bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {logDate}
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}