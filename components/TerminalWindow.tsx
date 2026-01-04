import React from 'react';

interface TerminalWindowProps {
  output: string[];
  command: string;
  onCommandChange: (val: string) => void;
  onExecute: () => void;
  isProcessing: boolean;
  promptUser?: string;
  title?: string;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  output,
  command,
  onCommandChange,
  onExecute,
  isProcessing,
  promptUser = 'kali@spel-lab',
  title = '终端 (Terminal)'
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onExecute();
    }
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-2xl border border-kali-panel bg-kali-bg font-mono text-sm">
      <div className="bg-kali-panel px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-gray-400 text-xs">{title}</span>
        <div className="w-10"></div>
      </div>
      <div className="p-4 h-64 overflow-y-auto bg-term-bg text-term-green">
        {output.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap mb-1">{line}</div>
        ))}
        <div className="flex items-center mt-2">
          <span className="text-kali-blue font-bold mr-2">┌──({promptUser})-[~]</span>
        </div>
        <div className="flex items-center">
          <span className="text-kali-blue font-bold mr-2">└─$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => onCommandChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 p-0"
            placeholder="输入命令..."
            autoFocus
          />
        </div>
        {isProcessing && <div className="text-gray-500 mt-2">处理中...</div>}
      </div>
    </div>
  );
};