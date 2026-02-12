import fs from 'fs';
import path from 'path';

interface KnowledgeNode {
  id: string;
  title: string;
  tags: string[];
  relatedNodes: string[];
  contentSummary: string;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeGraph {
  nodes: Record<string, KnowledgeNode>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
    relationship: string;
  }>;
  lastUpdated: string;
}

export class KnowledgeGraphDB {
  private readonly dbPath: string;
  
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'data', 'knowledge-graph.json');
    this.ensureDbExists();
  }
  
  private ensureDbExists(): void {
    if (!fs.existsSync(this.dbPath)) {
      const emptyGraph: KnowledgeGraph = {
        nodes: {},
        edges: [],
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(emptyGraph, null, 2));
    }
  }
  
  public async getGraph(): Promise<KnowledgeGraph> {
    try {
      const data = await fs.promises.readFile(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading knowledge graph:', error);
      throw new Error('Failed to read knowledge graph');
    }
  }
  
  public async updateNode(node: KnowledgeNode): Promise<void> {
    const graph = await this.getGraph();
    graph.nodes[node.id] = node;
    graph.lastUpdated = new Date().toISOString();
    await fs.promises.writeFile(this.dbPath, JSON.stringify(graph, null, 2));
  }
  
  public async addEdge(sourceId: string, targetId: string, weight: number, relationship: string): Promise<void> {
    const graph = await this.getGraph();
    
    // Check if edge already exists
    const existingEdgeIndex = graph.edges.findIndex(
      edge => edge.source === sourceId && edge.target === targetId
    );
    
    if (existingEdgeIndex >= 0) {
      // Update existing edge
      graph.edges[existingEdgeIndex].weight = weight;
      graph.edges[existingEdgeIndex].relationship = relationship;
    } else {
      // Add new edge
      graph.edges.push({ source: sourceId, target: targetId, weight, relationship });
    }
    
    graph.lastUpdated = new Date().toISOString();
    await fs.promises.writeFile(this.dbPath, JSON.stringify(graph, null, 2));
  }
  
  public async findRelatedNodes(nodeId: string, maxDepth: number = 2): Promise<string[]> {
    const graph = await this.getGraph();
    const related: Set<string> = new Set();
    const visited: Set<string> = new Set();
    
    const dfs = (currentId: string, depth: number) => {
      if (depth >= maxDepth || visited.has(currentId)) {
        return;
      }
      
      visited.add(currentId);
      
      // Find all connected nodes
      const connectedEdges = graph.edges.filter(
        edge => edge.source === currentId || edge.target === currentId
      );
      
      for (const edge of connectedEdges) {
        const connectedId = edge.source === currentId ? edge.target : edge.source;
        if (!visited.has(connectedId)) {
          related.add(connectedId);
          dfs(connectedId, depth + 1);
        }
      }
    };
    
    dfs(nodeId, 0);
    return Array.from(related);
  }
  
  public async calculateSimilarity(content1: string, content2: string): Promise<number> {
    // Simple similarity calculation based on shared words
    const words1 = new Set(content1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const words2 = new Set(content2.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    
    let commonWords = 0;
    for (const word of words1) {
      if (words2.has(word)) {
        commonWords++;
      }
    }
    
    const totalUniqueWords = words1.size + words2.size - commonWords;
    return totalUniqueWords > 0 ? commonWords / totalUniqueWords : 0;
  }
  
  public async mergeSimilarNodes(threshold: number = 0.8): Promise<number> {
    const graph = await this.getGraph();
    const knowledgeDb = require('./knowledge-db').KnowledgeDB;
    const kb = new knowledgeDb();
    const knowledgeEntries = await kb.getAllEntries();
    
    let mergedCount = 0;
    
    // Compare each pair of nodes
    const nodeIds = Object.keys(graph.nodes);
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const nodeId1 = nodeIds[i];
        const nodeId2 = nodeIds[j];
        
        const entry1 = knowledgeEntries.find(e => e.id === nodeId1);
        const entry2 = knowledgeEntries.find(e => e.id === nodeId2);
        
        if (entry1 && entry2) {
          const similarity = await this.calculateSimilarity(entry1.content, entry2.content);
          
          if (similarity >= threshold) {
            // Merge the nodes - keep the one with more content or newer
            const shouldKeepFirst = entry1.content.length >= entry2.content.length;
            const keptId = shouldKeepFirst ? nodeId1 : nodeId2;
            const mergedId = shouldKeepFirst ? nodeId2 : nodeId1;
            const keptEntry = shouldKeepFirst ? entry1 : entry2;
            const mergedEntry = shouldKeepFirst ? entry2 : entry1;
            
            // Update the kept entry with combined information
            const combinedTags = [...new Set([...keptEntry.tags, ...mergedEntry.tags])];
            const combinedContent = `${keptEntry.content}\n\n---\n\nMerged from similar content:\n${mergedEntry.content}`;
            
            await kb.updateEntry(keptId, {
              ...keptEntry,
              tags: combinedTags,
              content: combinedContent,
              updatedAt: new Date().toISOString()
            });
            
            // Remove the merged entry
            await kb.deleteEntry(mergedId);
            
            // Update graph - redirect edges to kept node
            graph.edges = graph.edges.map(edge => {
              if (edge.source === mergedId) {
                return { ...edge, source: keptId };
              }
              if (edge.target === mergedId) {
                return { ...edge, target: keptId };
              }
              return edge;
            }).filter(edge => edge.source !== edge.target); // Remove self-loops
            
            // Remove merged node
            delete graph.nodes[mergedId];
            
            mergedCount++;
          }
        }
      }
    }
    
    if (mergedCount > 0) {
      graph.lastUpdated = new Date().toISOString();
      await fs.promises.writeFile(this.dbPath, JSON.stringify(graph, null, 2));
    }
    
    return mergedCount;
  }
}