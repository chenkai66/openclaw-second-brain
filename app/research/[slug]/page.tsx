import { ContentManager } from '@/lib/content-manager';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export const revalidate = 3600;

export default async function ResearchDetailPage({ params }: { params: { slug: string } }) {
  const contentManager = new ContentManager();
  
  const reportExists = await contentManager.reportExists(params.slug);
  if (!reportExists) {
    notFound();
  }

  const content = await contentManager.getReport(params.slug);
  
  // Parse frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let metadata: Record<string, any> = {};
  
  if (frontmatterMatch) {
    const frontmatterContent = frontmatterMatch[1];
    
    const titleMatch = frontmatterContent.match(/title:\s*(.*)/);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    const dateMatch = frontmatterContent.match(/date:\s*(.*)/);
    if (dateMatch) {
      metadata.date = dateMatch[1].trim();
    }
    
    const summaryMatch = frontmatterContent.match(/summary:\s*"?([^"\n]*)"?/);
    if (summaryMatch) {
      metadata.summary = summaryMatch[1].trim();
    }
    
    const tagsMatch = frontmatterContent.match(/tags:\s*\[(.*?)\]/);
    if (tagsMatch && tagsMatch[1].trim()) {
      metadata.tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
    }
  }
  
  // Remove frontmatter from content
  const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/research"
          className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回研究列表
        </Link>

        <article className="prose prose-invert prose-purple max-w-none">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
              {metadata.title || params.slug}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              {metadata.date && (
                <span>📅 {new Date(metadata.date).toLocaleDateString('zh-CN')}</span>
              )}
              <span>📊 Daily Research</span>
            </div>

            {metadata.summary && (
              <p className="text-lg text-gray-300 italic border-l-4 border-purple-500 pl-4 py-2 bg-purple-500/5 rounded-r">
                {metadata.summary}
              </p>
            )}

            {metadata.tags && metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {metadata.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <MarkdownRenderer content={contentWithoutFrontmatter} />
        </article>
      </div>
    </div>
  );
}

