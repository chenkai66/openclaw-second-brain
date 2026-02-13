import { ContentManager } from '@/lib/content-manager';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const contentManager = new ContentManager();
    const reports = await contentManager.getAllReports();
    
    // Process reports to remove frontmatter from content
    const processedReports = reports.map(report => {
      const contentWithoutFrontmatter = report.content.replace(/^---\n[\s\S]*?\n---\n/, '');
      return {
        slug: report.slug,
        metadata: report.metadata,
        preview: contentWithoutFrontmatter.substring(0, 200) + '...'
      };
    });
    
    return NextResponse.json(processedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

