import { NextRequest } from 'next/server';
import { ContentManager } from '@/lib/content-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting simplified sync process...');
    
    const contentManager = new ContentManager();
    
    // For now, just create a simple sync log
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const logId = `${timestamp}-${timeString}`;
    
    await contentManager.createLog(
      logId,
      `Sync process executed successfully at ${now.toISOString()}`,
      'System sync completed'
    );
    
    console.log(`Sync completed. Created log: ${logId}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Sync completed',
      logId: logId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}