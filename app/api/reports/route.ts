import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Report {
  id: string;
  content: string;
  type: string;
}

// Helper function to read report files
async function getReports(): Promise<Report[]> {
  try {
    const reportsDir = path.join(process.cwd(), 'content', 'reports');
    const dailyResearchDir = path.join(reportsDir, 'daily-research');
    
    let reports: Report[] = [];
    
    // Read daily research reports
    if (fs.existsSync(dailyResearchDir)) {
      const files = fs.readdirSync(dailyResearchDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(dailyResearchDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          reports.push({
            id: file.replace('.md', ''),
            content: content,
            type: 'daily-research'
          });
        }
      }
    }
    
    // Read main report files (like daily-research.md)
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir);
      for (const file of files) {
        if (file.endsWith('.md') && file !== 'daily-research.md') {
          const filePath = path.join(reportsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          reports.push({
            id: file.replace('.md', ''),
            content: content,
            type: 'report'
          });
        }
      }
    }
    
    return reports;
  } catch (error) {
    console.error('Error reading reports:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const reports = await getReports();
    return new Response(JSON.stringify(reports), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in reports API:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch reports' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}