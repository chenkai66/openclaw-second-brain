'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { KnowledgeGraph, GraphNode, GraphEdge } from '@/lib/graph-builder';

interface KnowledgeGraphViewerProps {
  width?: number;
  height?: number;
}

export default function KnowledgeGraphViewer({ 
  width = 1200, 
  height = 800 
}: KnowledgeGraphViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    fetchGraph();
  }, []);

  useEffect(() => {
    if (graph && svgRef.current) {
      renderGraph();
    }
  }, [graph]);

  const fetchGraph = async () => {
    try {
      const response = await fetch('/api/graph');
      const data = await response.json();
      setGraph(data);
    } catch (error) {
      console.error('Failed to fetch graph:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGraph = () => {
    if (!graph || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svg.append('g');

    // 添加缩放功能
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 创建力导向图
    const simulation = d3.forceSimulation(graph.nodes as any)
      .force('link', d3.forceLink(graph.edges)
        .id((d: any) => d.id)
        .distance(100)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 10));

    // 绘制边
    const link = container.append('g')
      .selectAll('line')
      .data(graph.edges)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: GraphEdge) => Math.sqrt(d.weight));

    // 绘制节点
    const node = container.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .call(d3.drag<any, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // 节点圆圈
    node.append('circle')
      .attr('r', (d: GraphNode) => d.size)
      .attr('fill', (d: GraphNode) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d: GraphNode) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on('mouseover', function(event, d: GraphNode) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size * 1.5);
      })
      .on('mouseout', function(event, d: GraphNode) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size);
      });

    // 节点标签
    node.append('text')
      .text((d: GraphNode) => d.label)
      .attr('x', 0)
      .attr('y', (d: GraphNode) => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'currentColor')
      .style('pointer-events', 'none');

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p>暂无知识图谱数据</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 图谱统计 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <span className="text-gray-600 dark:text-gray-400">
              笔记 ({graph.stats.noteCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span className="text-gray-600 dark:text-gray-400">
              日志 ({graph.stats.logCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-600"></div>
            <span className="text-gray-600 dark:text-gray-400">
              标签 ({graph.stats.tagCount})
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {graph.stats.totalEdges} 个连接
        </div>
      </div>

      {/* SVG 画布 */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-auto"
          style={{ minHeight: '600px' }}
        />
      </div>

      {/* 节点详情面板 */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedNode.color }}
              ></div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {selectedNode.label}
              </h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">类型:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedNode.type === 'note' ? '笔记' : selectedNode.type === 'log' ? '日志' : '标签'}
              </span>
            </div>
            
            {selectedNode.metadata?.created && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">创建:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedNode.metadata.created}
                </span>
              </div>
            )}

            {selectedNode.metadata?.tags && (
              <div className="mt-3">
                <span className="text-gray-600 dark:text-gray-400 block mb-2">标签:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.metadata.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedNode.type !== 'tag' && (
            <a
              href={`/${selectedNode.type === 'note' ? 'notes' : 'logs'}/${selectedNode.id.replace(/^(note|log)-/, '')}`}
              className="mt-4 block w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              查看详情
            </a>
          )}
        </div>
      )}

      {/* 操作提示 */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-4">
        <span>🖱️ 拖拽节点移动</span>
        <span>🔍 滚轮缩放</span>
        <span>👆 点击查看详情</span>
      </div>
    </div>
  );
}

