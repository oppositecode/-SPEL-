import React, { useState } from 'react';

interface CodeViewerProps {
  filename: string;
  code: string;
  language?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ filename, code, language = 'java' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 border border-kali-panel rounded-lg overflow-hidden bg-[#1e1e1e]">
      <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-kali-panel">
        <span className="text-sm font-mono text-gray-300">{filename}</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-kali-blue text-white hover:bg-blue-600 transition"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};