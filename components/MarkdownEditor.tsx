"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the editor to avoid SSR issues
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false,
});

// Import styles
import 'react-markdown-editor-lite/lib/index.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function MarkdownEditor({ 
  value, 
  onChange, 
  onSave, 
  onCancel 
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
        <div className="flex space-x-2">
          <button
            onClick={() => setIsPreview(false)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              !isPreview 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              isPreview 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1 rounded-md text-sm font-medium bg-green-500 text-white hover:bg-green-600"
          >
            Save
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <MdEditor
          value={value}
          style={{ height: '500px' }}
          config={{
            view: {
              menu: true,
              md: !isPreview,
              html: isPreview,
              fullScreen: false,
              hideMenu: false,
            },
            plugins: {
              toolbar: [
                'bold',
                'italic',
                'underline',
                'strike',
                'blockquote',
                'code',
                'link',
                'image',
                'ol',
                'ul',
                'hr',
                'table',
                'header',
                'alignleft',
                'aligncenter',
                'alignright',
                'undo',
                'redo',
              ],
            },
          }}
          onChange={({ text }) => onChange(text)}
          onCustomImageUpload={() => Promise.resolve('')}
        />
      </div>
    </div>
  );
}