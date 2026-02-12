import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getNoteBySlug, deleteNote } from '@/lib/content-manager';
import MarkdownEditor from '@/components/MarkdownEditor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const note = await getNoteBySlug(params.slug);
  if (!note) return {};
  
  return {
    title: note.title,
    description: note.summary,
  };
}

export default async function NotePage({ params }: { params: { slug: string } }) {
  const note = await getNoteBySlug(params.slug);
  
  if (!note) {
    notFound();
  }

  const handleDelete = async () => {
    try {
      await deleteNote(params.slug);
      toast.success('Note deleted successfully');
      // Redirect to home page after deletion
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">{note.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {note.tags?.map((tag: string) => (
              <span 
                key={tag} 
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">Back</Button>
          </Link>
          <Button onClick={handleDelete} variant="destructive">Delete</Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<div>Loading editor...</div>}>
            <MarkdownEditor 
              initialContent={note.content} 
              onSave={async (content) => {
                // Save logic would go here
                toast.success('Note updated successfully');
              }}
            />
          </Suspense>
        </CardContent>
      </Card>
      
      {note.related_logs && note.related_logs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Related Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {note.related_logs.map((logDate: string) => (
              <Link key={logDate} href={`/logs/${logDate}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{logDate}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}