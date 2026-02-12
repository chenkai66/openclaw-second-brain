import Link from 'next/link';
import { format } from 'date-fns';

interface LogCardProps {
  date: string;
  summary: string;
  topics: string[];
}

export default function LogCard({ date, summary, topics }: LogCardProps) {
  return (
    <Link href={`/logs/${date}`} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 mb-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(new Date(date), 'MMMM d, yyyy')}
          </h3>
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
            Daily Log
          </span>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
          {summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((topic) => (
            <span 
              key={topic} 
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
            >
              #{topic}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}