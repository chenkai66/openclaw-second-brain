import { NextRequest } from 'next/server';
import { ContentManager } from '@/lib/content-manager';

/**
 * POST /api/logs
 * Creates a new daily log entry
 * Expects: { date: string (YYYY-MM-DD), content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { date, content } = await request.json();
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: 'Invalid date format. Expected YYYY-MM-DD' }, { status: 400 });
    }
    
    const contentManager = new ContentManager();
    const logPath = await contentManager.createLog(date, content);
    
    return Response.json({ 
      success: true, 
      path: logPath,
      message: `Daily log for ${date} created successfully`
    });
  } catch (error) {
    console.error('Error creating log:', error);
    return Response.json({ error: 'Failed to create log' }, { status: 500 });
  }
}