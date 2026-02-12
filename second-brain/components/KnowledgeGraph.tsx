"use client";

import React, { useState, useEffect } from 'react';
import { ForceGraph2D } from 'react-force-graph';

interface Node {
  id: string;
  name: string;
  type: 'log' | 'note';
  val: number;
}

interface Link {
  source: string;
  target: string;
}

interface KnowledgeGraphProps {
  logs: Array<{ date: string; summary: string }>;
  notes: Array<{ slug: string; title: string; tags: string[] }>;
}

export default function KnowledgeGraph({ logs, notes }: KnowledgeGraphProps) {
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({
    nodes: [],
    links: []
  });

  useEffect(() => {
    // Create nodes from logs and notes
    const nodes: Node[] = [
      ...logs.map(log => ({
        id: log.date,
        name: log.date,
        type: 'log' as const,
        val: 10
      })),
      ...notes.map(note => ({
        id: note.slug,
        name: note.title,
        type: 'note' as const,
        val: 15
      }))
    ];

    // Create links between related items
    // For simplicity, we'll connect recent logs to notes with matching tags
    const links: Link[] = [];
    
    // Connect each note to logs that might be related (simplified logic)
    notes.forEach(note => {
      logs.slice(-3).forEach(log => {
        links.push({
          source: log.date,
          target: note.slug
        });
      });
    });

    setGraphData({ nodes, links });
  }, [logs, notes]);

  return (
    <div className="w-full h-96 border rounded-lg bg-white dark:bg-gray-800 mb-6">
      <h3 className="text-lg font-semibold p-4 pb-2">Knowledge Connections</h3>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeVal="val"
        nodeColor={node => node.type === 'log' ? '#3b82f6' : '#10b981'}
        linkWidth={1}
        linkColor={() => '#94a3b8'}
        backgroundColor="transparent"
        width={800}
        height={300}
      />
    </div>
  );
}