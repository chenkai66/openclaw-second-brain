import { ContentManager } from "@/lib/content-manager";
import Link from "next/link";
import { format } from "date-fns";

export default async function HomePage() {
  // Get all logs and notes
  const contentManager = new ContentManager();
  const logs = await contentManager.getAllLogs();
  const notes = await contentManager.getAllNotes();
  
  // Sort logs by date (newest first)
  const sortedLogs = logs.sort((a, b) => 
    new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime()
  );
  
  // Sort notes by creation date (newest first)
  const sortedNotes = notes.sort((a, b) => 
    new Date(b.metadata.created).getTime() - new Date(a.metadata.created).getTime()
  );

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-2">Second Brain</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your personal knowledge management system
        </p>
      </header>

      {/* Knowledge Summary Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Knowledge Summary</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Updated just now
          </span>
        </div>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p>
            Your conversations are being analyzed in real-time. New insights and concepts 
            are automatically extracted and organized into structured notes.
          </p>
          <p>
            Check back frequently to see your knowledge base grow!
          </p>
        </div>
      </section>

      {/* Notes Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Concept Notes</h2>
          <Link 
            href="/notes/new" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Create New
          </Link>
        </div>
        
        {sortedNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No concept notes yet. They will appear here as you have conversations.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedNotes.map((note) => (
              <Link 
                key={note.slug} 
                href={`/notes/${note.slug}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{note.metadata.title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(note.metadata.created), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
                  {note.metadata.summary}
                </p>
                {note.metadata.tags && note.metadata.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {note.metadata.tags.map((tag: string) => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Daily Logs Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Daily Logs</h2>
        
        {sortedLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No daily logs yet. They will be created automatically.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map((log) => (
              <Link 
                key={log.date} 
                href={`/logs/${log.date}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{log.date}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(log.date), 'EEEE')}
                  </span>
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
                  {log.metadata.summary}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}