import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal as TerminalIcon } from 'lucide-react';
import './Terminal.module.css';

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

  const getColorClass = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'term-text-info';
      case 'warn': return 'term-text-warn';
      case 'error': return 'term-text-error';
      case 'success': return 'term-text-success';
      default: return 'term-text-default';
    }
  };

  return (
    <div className="term-container">
      <div className="term-header">
        <div className="term-title-section">
          <TerminalIcon size={16} className="term-text-default" style={{color: '#9ca3af'}} />
          <span className="term-title">Bot Console Output</span>
        </div>
        <div className="term-controls">
          <div className="term-dot term-dot-red"></div>
          <div className="term-dot term-dot-yellow"></div>
          <div className="term-dot term-dot-green"></div>
        </div>
      </div>
      <div ref={scrollRef} className="term-content">
        {logs.length === 0 && (
          <div className="term-empty-state">Waiting for bot logs...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="term-log-entry">
            <span className="term-timestamp">
              [{log.timestamp.toLocaleTimeString()}]
            </span>
            <span className={`term-message ${getColorClass(log.level)}`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};