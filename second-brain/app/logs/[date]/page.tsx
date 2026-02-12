import { notFound } from 'next/navigation';
import { getContentManager } from '@/lib/content-manager';
import MarkdownEditor from '@/components/MarkdownEditor';
import Link from 'next/link';

interface LogPageProps {
  params: {
    date: string;
  };
}

export default async function LogPage({ params }: LogPageProps) {
  const { date } = params;
  const contentManager = getContentManager();
  const log = await contentManager.getNote(`logs/${date}`);
  
  if (!log) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {log.frontmatter.date}
        </h1>
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to all logs
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <MarkdownEditor 
            initialContent={log.content} 
            frontmatter={log.frontmatter}
            type="log"
            identifier={date}
          />
        </div>
      </div>
      
      {log.frontmatter.topics && log.frontmatter.topics.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Related Topics</h2>
          <div className="flex flex-wrap gap-2">
            {log.frontmatter.topics.map((topic: string) => (
              <span 
                key={topic}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                #{topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}