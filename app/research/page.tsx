import { ContentManager } from '@/lib/content-manager';
import Link from 'next/link';

export const revalidate = 3600; // Revalidate every hour

export default async function ResearchPage() {
  const contentManager = new ContentManager();
  const reports = await contentManager.getAllReports();

  // Remove frontmatter from content
  const processedReports = reports.map(report => {
    const contentWithoutFrontmatter = report.content.replace(/^---\n[\s\S]*?\n---\n/, '');
    return {
      ...report,
      contentWithoutFrontmatter
    };
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
            📊 Daily Research
          </h1>
          <p className="text-gray-400 text-lg">
            深度技术调研报告与行业分析
          </p>
        </div>

        <div className="grid gap-6">
          {processedReports.map((report) => (
            <Link
              key={report.slug}
              href={`/research/${report.slug}`}
              className="group block p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                  {report.metadata.title || report.slug}
                </h2>
                {report.metadata.date && (
                  <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                    {new Date(report.metadata.date).toLocaleDateString('zh-CN')}
                  </span>
                )}
              </div>
              
              {report.metadata.summary && (
                <p className="text-gray-400 mb-4 line-clamp-2">
                  {report.metadata.summary}
                </p>
              )}
              
              {report.metadata.tags && report.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {report.metadata.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        {processedReports.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">暂无研究报告</p>
          </div>
        )}
      </div>
    </div>
  );
}

