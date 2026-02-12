import { NextRequest } from 'next/server';
import { ContentManager } from '@/lib/content-manager';
import { AIOrganizer } from '@/lib/ai-organizer';

const contentManager = new ContentManager();

export async function POST(request: NextRequest) {
  try {
    const { title, content, tags = [], relatedLogs = [] } = await request.json();
    
    // Use AI to generate a semantic slug if not provided
    const slug = await AIOrganizer.generateSlug(title);
    
    // Create note metadata
    const metadata = {
      title,
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      tags,
      related_logs: relatedLogs,
      ai_refined: true
    };
    
    // Create the note file
    await contentManager.createNote(slug, metadata, content);
    
    return new Response(JSON.stringify({ success: true, slug }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return new Response(JSON.stringify({ error: 'Failed to create note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}