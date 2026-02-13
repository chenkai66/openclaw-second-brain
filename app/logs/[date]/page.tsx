import { notFound } from 'next/navigation';
import { ContentManager } from '@/lib/content-manager';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// 启用增量静态生成
export const revalidate = 60;

// 生成静态参数
export async function generateStaticParams() {
  const contentManager = new ContentManager();
  const logs = await contentManager.getAllLogs();
  
  return logs.map((log) => ({
    date: log.slug,
  }));
}

interface LogPageProps {
  params: {
    date: string;
  };
}

export default async function LogPage({ params }: LogPageProps) {
  const { date } = params;
  const contentManager = new ContentManager();
  
  // Check if log exists
  const logExists = await contentManager.logExists(date);
  if (!logExists) {
    notFound();
  }
  
  const logContent = await contentManager.getLog(date);
  const allLogs = await contentManager.getAllLogs();
  const log = allLogs.find(l => l.slug === date);
  
  if (!log) {
    notFound();
  }
  
  // Extract content without frontmatter
  const contentWithoutFrontmatter = logContent.replace(/^---\n[\s\S]*?\n---\n/, '');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-8 group"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      {/* Log header */}
      <header className="mb-12">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {log.date}
              </h1>
            </div>
            {log.metadata.summary && (
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                {log.metadata.summary}
              </p>
            )}
          </div>
        </div>

        {/* Topics */}
        {log.metadata.topics && log.metadata.topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {log.metadata.topics.map((topic: string) => (
              <span 
                key={topic} 
                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Log content */}
      <article className="prose prose-lg dark:prose-invert max-w-none bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800">
        <MarkdownRenderer content={contentWithoutFrontmatter} />
      </article>

      {/* Navigation */}
      <nav className="mt-12 flex justify-between items-center">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          查看所有日志
        </Link>
      </nav>
    </div>
  );
}