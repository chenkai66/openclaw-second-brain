import { NextRequest, NextResponse } from 'next/server';
import { ContentManager } from '@/lib/content-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const contentManager = new ContentManager();
    const note = await contentManager.getNote(params.slug);
    
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const contentManager = new ContentManager();
    const { content, tags } = await request.json();
    
    // Validate input
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }
    
    // Validate tags
    const validTags = Array.isArray(tags) ? tags : [];
    
    await contentManager.updateNote(params.slug, content, validTags);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const contentManager = new ContentManager();
    await contentManager.deleteNote(params.slug);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}