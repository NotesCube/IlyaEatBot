import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Utensils, Info } from 'lucide-react';
import { Terminal } from './components/Terminal';
import BotStatusCard from './components/BotStatusCard';
import { botService } from './services/botService';
import { logger } from './services/loggerService';
import { setBotMode } from './services/configService';
import { BotStatus, LogEntry, BotMode } from './types';

export function App() {
  const [status, setStatus] = useState<BotStatus>(BotStatus.IDLE);
  const [mode, setMode] = useState<BotMode>('TEST');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [...prev, entry].slice(-100)); // Keep last 100 logs
  }, []);

  useEffect(() => {
    // Bind logger
    logger.subscribe(addLog);
    
    // Initial log
    logger.log('info', 'System ready. Click "Start Bot" to initialize polling.');

    return () => {
      botService.stop();
    };
  }, [addLog]);

  const handleModeChange = (newMode: BotMode) => {
    setMode(newMode);
    setBotMode(newMode);
    logger.log('info', `Switched AI configuration to ${newMode} mode.`);
  };

  const toggleBot = async () => {
    if (status === BotStatus.RUNNING) {
      setIsLoading(true);
      await botService.stop();
      setStatus(BotStatus.STOPPED);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      setStatus(BotStatus.IDLE);
      try {
        await botService.start();
        setStatus(BotStatus.RUNNING);
      } catch (err) {
        setStatus(BotStatus.ERROR);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Utensils size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">CalorieBot</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Bot size={16} />
            <span>Dashboard</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Controls & Info */}
          <div className="lg:col-span-1 space-y-6">
            <BotStatusCard 
              status={status} 
              mode={mode}
              onToggle={toggleBot} 
              onModeChange={handleModeChange}
              isLoading={isLoading} 
            />

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Info size={20} />
                <h3 className="font-semibold">Project Structure</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono text-xs">services/botService.ts</code>
                  <span>Main entry point</span>
                </li>
                <li className="flex gap-2">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono text-xs">handlers/calculate.ts</code>
                  <span>Command logic</span>
                </li>
                <li className="flex gap-2">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono text-xs">handlers/message.ts</code>
                  <span>Processing</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  The bot uses <strong>grammY</strong> framework. It is designed to be scalable by separating command handlers and message processing logic.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Terminal */}
          <div className="lg:col-span-2">
             <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Live Logs</h3>
                <p className="text-sm text-gray-500">Monitor bot activity and debugging information.</p>
             </div>
            <Terminal logs={logs} />
            
            {status === BotStatus.ERROR && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <strong>Connection Failed?</strong> 
                <p className="mt-1">
                  This is expected when running a Telegram Bot purely in the browser due to CORS. 
                  To run this bot for real:
                </p>
                <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                  <li>Copy the code from <code>services/</code></li>
                  <li>Install dependencies: <code>npm install grammy</code></li>
                  <li>Run with <code>ts-node services/botService.ts</code></li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}