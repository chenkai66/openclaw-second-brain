import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // Construct the file path for the report
    const reportPath = path.join(process.cwd(), 'content', 'reports', 'daily-research', `${slug}.md`);
    
    // Check if file exists
    await fs.access(reportPath);
    
    // Read the file content
    const content = await fs.readFile(reportPath, 'utf8');
    
    return new Response(JSON.stringify({ 
      id: slug,
      content: content,
      success: true 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return new Response(JSON.stringify({ 
      error: 'Report not found',
      success: false 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}