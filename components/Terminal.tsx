import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: LogEntry[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden flex flex-col h-96 w-full border border-gray-800">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-gray-400" />
          <span className="text-sm font-mono text-gray-400">Bot Console Output</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1">
        {logs.length === 0 && (
          <div className="text-gray-500 italic">Waiting for bot logs...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 items-start">
            <span className="text-gray-600 shrink-0 select-none text-xs pt-0.5">
              [{log.timestamp.toLocaleTimeString()}]
            </span>
            <span className={`${getColor(log.level)} break-all whitespace-pre-wrap`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};