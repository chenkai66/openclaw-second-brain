import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface NoteCardProps {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary?: string;
  type: 'note' | 'log';
}

const NoteCard: React.FC<NoteCardProps> = ({ slug, title, date, tags, summary, type }) => {
  const formattedDate = format(new Date(date), 'MMM d, yyyy');
  const href = type === 'note' ? `/notes/${slug}` : `/logs/${slug}`;
  
  return (
    <Link href={href} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 mb-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
            {type === 'note' ? 'Concept' : 'Log'}
          </span>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{formattedDate}</p>
        
        {summary && (
          <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{summary}</p>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default NoteCard;