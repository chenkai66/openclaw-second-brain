import { ContentManager } from "@/lib/content-manager";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import NotesGrid from "./NotesGrid";

// 启用增量静态生成（ISR）- 每60秒重新验证
export const revalidate = 60;

// 启用静态生成
export const dynamic = 'force-static';

export default async function HomePage() {
  const contentManager = new ContentManager();
  const logs = await contentManager.getAllLogs();
  const notes = await contentManager.getAllNotes();
  const reports = await contentManager.getAllReports();

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <header className="relative overflow-hidden mb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.2),transparent_50%)]"></div>
        
        <div className="relative text-center py-20 px-4">
          <div className="inline-block mb-6 animate-float">
            <svg className="w-20 h-20 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Second Brain
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            智能知识管理系统 · 让思想永不遗忘
          </p>
          
          {/* 搜索栏 */}
          <div className="flex justify-center mb-8">
            <SearchBar />
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-600 dark:text-gray-400">实时同步</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{notes.length}</span>
              <span className="text-gray-600 dark:text-gray-400">概念笔记</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-600 dark:text-purple-400">{logs.length}</span>
              <span className="text-gray-600 dark:text-gray-400">日志记录</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-pink-600 dark:text-pink-400">{reports.length}</span>
              <span className="text-gray-600 dark:text-gray-400">研究报告</span>
            </div>
          </div>
        </div>
      </header>

      {/* Notes Section with Filter */}
      <NotesGrid notes={notes} />

      {/* 快捷入口 */}
      <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/graph">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white hover:shadow-2xl transition-all duration-300 group cursor-pointer">
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                探索知识图谱
              </h3>
              <p className="text-white/90">
                可视化展示笔记、日志和标签之间的关系网络
              </p>
            </div>
          </div>
        </Link>

        <Link href="/research">
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl p-8 text-white hover:shadow-2xl transition-all duration-300 group cursor-pointer">
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                每日研究报告
              </h3>
              <p className="text-white/90">
                深度技术调研与行业分析，追踪最新趋势
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Daily Research Preview */}
      {reports.length > 0 && (
        <section className="mb-16">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">最新研究</h2>
                <p className="text-gray-600 dark:text-gray-400">深度技术调研报告</p>
              </div>
              <Link href="/research" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-2">
                查看全部
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.slice(0, 3).map((report, index) => (
              <Link 
                key={report.slug} 
                href={`/research/${report.slug}`}
                className="group block"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:-translate-y-1">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">📊</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 mb-2">
                        {report.metadata.title || report.slug}
                      </h3>
                      {report.metadata.date && (
                        <span className="text-xs text-gray-500">
                          {new Date(report.metadata.date).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>
                  {report.metadata.summary && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                      {report.metadata.summary}
                    </p>
                  )}
                  {report.metadata.tags && report.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {report.metadata.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Daily Logs Section */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">每日日志</h2>
          <p className="text-gray-600 dark:text-gray-400">自动记录的对话历史与活动轨迹</p>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">暂无日志记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.slice(0, 10).map((log, index) => (
              <Link 
                key={log.slug} 
                href={`/logs/${log.slug}`}
                className="group block"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:-translate-y-0.5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {log.date}
                        </h3>
                        <span className="text-xs px-2.5 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                          日志
                        </span>
                      </div>
                      {log.metadata.summary && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1">
                          {log.metadata.summary}
                        </p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}