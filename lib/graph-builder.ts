import fs from 'fs';
import path from 'path';

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'log' | 'tag';
  size: number;
  color: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'related' | 'tagged' | 'referenced';
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    noteCount: number;
    logCount: number;
    tagCount: number;
  };
}

export class GraphBuilder {
  private contentDir: string;
  private logsDir: string;
  private notesDir: string;

  constructor() {
    this.contentDir = path.join(process.cwd(), 'content');
    this.logsDir = path.join(this.contentDir, 'logs');
    this.notesDir = path.join(this.contentDir, 'notes');
  }

  /**
   * 构建知识图谱
   */
  async buildGraph(): Promise<KnowledgeGraph> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const tagMap = new Map<string, Set<string>>();

    // 处理笔记
    if (fs.existsSync(this.notesDir)) {
      const noteFiles = fs.readdirSync(this.notesDir);
      
      for (const file of noteFiles) {
        if (!file.endsWith('.md')) continue;
        
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(this.notesDir, file), 'utf8');
        const { metadata } = this.parseMarkdown(content);

        // 添加笔记节点
        nodes.push({
          id: `note-${slug}`,
          label: metadata.title || slug,
          type: 'note',
          size: 20,
          color: '#4F46E5',
          metadata,
        });

        // 处理标签
        if (metadata.tags) {
          for (const tag of metadata.tags) {
            if (!tagMap.has(tag)) {
              tagMap.set(tag, new Set());
            }
            tagMap.get(tag)!.add(`note-${slug}`);
          }
        }

        // 处理相关日志
        if (metadata.related_logs) {
          for (const logDate of metadata.related_logs) {
            edges.push({
              source: `note-${slug}`,
              target: `log-${logDate}`,
              weight: 2,
              type: 'related',
            });
          }
        }
      }
    }

    // 处理日志
    if (fs.existsSync(this.logsDir)) {
      const logFiles = fs.readdirSync(this.logsDir);
      
      for (const file of logFiles) {
        if (!file.endsWith('.md')) continue;
        
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(this.logsDir, file), 'utf8');
        const { metadata } = this.parseMarkdown(content);

        // 添加日志节点
        nodes.push({
          id: `log-${slug}`,
          label: metadata.date || slug,
          type: 'log',
          size: 15,
          color: '#A855F7',
          metadata,
        });

        // 处理主题标签
        if (metadata.topics) {
          for (const topic of metadata.topics) {
            if (!tagMap.has(topic)) {
              tagMap.set(topic, new Set());
            }
            tagMap.get(topic)!.add(`log-${slug}`);
          }
        }
      }
    }

    // 添加标签节点和边
    for (const [tag, relatedNodes] of tagMap.entries()) {
      const tagId = `tag-${tag}`;
      
      // 添加标签节点
      nodes.push({
        id: tagId,
        label: tag,
        type: 'tag',
        size: 10 + relatedNodes.size * 2,
        color: '#EC4899',
      });

      // 添加标签到内容的边
      for (const nodeId of relatedNodes) {
        edges.push({
          source: tagId,
          target: nodeId,
          weight: 1,
          type: 'tagged',
        });
      }
    }

    // 计算统计信息
    const stats = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      noteCount: nodes.filter(n => n.type === 'note').length,
      logCount: nodes.filter(n => n.type === 'log').length,
      tagCount: nodes.filter(n => n.type === 'tag').length,
    };

    return { nodes, edges, stats };
  }

  /**
   * 解析 Markdown 文件
   */
  private parseMarkdown(content: string): {
    metadata: Record<string, any>;
    body: string;
  } {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      return { metadata: {}, body: content };
    }

    const frontmatterContent = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    const metadata: Record<string, any> = {};

    // 解析 frontmatter
    const lines = frontmatterContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        
        // 处理数组
        if (value.startsWith('[') && value.endsWith(']')) {
          const arrayContent = value.slice(1, -1);
          metadata[key] = arrayContent
            .split(',')
            .map(item => item.trim().replace(/"/g, ''))
            .filter(item => item);
        } else {
          metadata[key] = value.replace(/"/g, '');
        }
      }
    }

    return { metadata, body };
  }

  /**
   * 获取节点的邻居
   */
  async getNeighbors(nodeId: string, depth: number = 1): Promise<KnowledgeGraph> {
    const fullGraph = await this.buildGraph();
    const visitedNodes = new Set<string>([nodeId]);
    const visitedEdges = new Set<string>();
    
    // BFS 遍历
    let currentLevel = [nodeId];
    for (let i = 0; i < depth; i++) {
      const nextLevel: string[] = [];
      
      for (const currentNode of currentLevel) {
        // 找到所有相关的边
        for (const edge of fullGraph.edges) {
          const edgeKey = `${edge.source}-${edge.target}`;
          
          if (edge.source === currentNode && !visitedNodes.has(edge.target)) {
            visitedNodes.add(edge.target);
            visitedEdges.add(edgeKey);
            nextLevel.push(edge.target);
          } else if (edge.target === currentNode && !visitedNodes.has(edge.source)) {
            visitedNodes.add(edge.source);
            visitedEdges.add(edgeKey);
            nextLevel.push(edge.source);
          }
        }
      }
      
      currentLevel = nextLevel;
    }

    // 过滤节点和边
    const nodes = fullGraph.nodes.filter(n => visitedNodes.has(n.id));
    const edges = fullGraph.edges.filter(e => 
      visitedEdges.has(`${e.source}-${e.target}`)
    );

    return {
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        noteCount: nodes.filter(n => n.type === 'note').length,
        logCount: nodes.filter(n => n.type === 'log').length,
        tagCount: nodes.filter(n => n.type === 'tag').length,
      },
    };
  }
}

