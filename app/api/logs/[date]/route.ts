import { NextRequest } from 'next/server';
import { ContentManager } from '@/lib/content-manager';

const contentManager = new ContentManager();

// GET: Retrieve a specific daily log
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const log = await contentManager.getLog(params.date);
    if (!log) {
      return new Response(JSON.stringify({ error: 'Log not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(log), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching log:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT: Update a specific daily log
export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const body = await request.json();
    const { content, summary, topics } = body;
    
    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await contentManager.updateLog(params.date, content, summary || '');
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating log:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE: Remove a specific daily log
export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const success = await contentManager.deleteLog(params.date);
    
    if (!success) {
      return new Response(JSON.stringify({ error: 'Log not found or could not be deleted' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting log:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}