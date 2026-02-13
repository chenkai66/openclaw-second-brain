import KnowledgeGraphViewer from '@/components/KnowledgeGraphViewer';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// 动态导入知识图谱组件，减少初始加载
const DynamicKnowledgeGraphViewer = dynamic(
  () => import('@/components/KnowledgeGraphViewer'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading Knowledge Graph...</p>
        </div>
      </div>
    ),
    ssr: false, // 禁用服务端渲染，因为 D3 需要浏览器环境
  }
);

export const metadata = {
  title: 'Knowledge Graph - Second Brain',
  description: 'Visualize relationships between notes, logs, and tags',
};

// 启用缓存
export const revalidate = 300; // 5分钟

export default function GraphPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Knowledge Graph
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Explore relationships between notes, logs, and tags
            </p>
          </div>
        </div>
      </div>

      {/* 图谱查看器 */}
      <DynamicKnowledgeGraphViewer />

      {/* 使用说明 */}
      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How to Use
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">•</span>
            <span><strong>Node Colors:</strong> Blue for notes, purple for logs, pink for tags</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">•</span>
            <span><strong>Node Size:</strong> Larger nodes have more connections</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">•</span>
            <span><strong>Links:</strong> Show relationships between content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">•</span>
            <span><strong>Interactions:</strong> Drag nodes to move, scroll to zoom, click to view details</span>
          </li>
        </ul>
      </div>
      </div>
    </div>
  );
}

