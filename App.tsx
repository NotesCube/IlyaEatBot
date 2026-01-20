import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Utensils, Moon, Sun } from 'lucide-react';
import { Terminal } from './components/Terminal';
import BotStatusCard from './components/BotStatusCard';
import { botService } from './services/botService';
import { logger } from './services/loggerService';
import { setBotMode } from './services/configService';
import { BotStatus, LogEntry, BotMode } from './types';
import './App.module.css';

export function App() {
  const [status, setStatus] = useState<BotStatus>(BotStatus.IDLE);
  const [mode, setMode] = useState<BotMode>('TEST');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  const addLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [...prev, entry].slice(-100)); // Keep last 100 logs
  }, []);

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Bind logger
    logger.subscribe(addLog);
    
    // Initial log
    logger.log('info', 'System ready. Click "Start Bot" to initialize polling.');

    return () => {
      botService.stop();
    };
  }, [addLog]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-content">
          <div className="app-logo-section">
            <div className="app-logo-icon">
              <Utensils size={24} />
            </div>
            <h1 className="app-title">CalorieBot</h1>
          </div>
          
          <div className="app-header-actions">
             <button 
                onClick={toggleTheme} 
                className="app-theme-toggle"
                aria-label="Toggle theme"
             >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
             </button>
             <div className="app-meta-section">
                <Bot size={16} />
                <span>Dashboard</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        
        <div className="app-grid">
          {/* Left Column: Controls & Info */}
          <div className="app-left-column">
            <BotStatusCard 
              status={status} 
              mode={mode}
              onToggle={toggleBot} 
              onModeChange={handleModeChange}
              isLoading={isLoading} 
            />
          </div>

          {/* Right Column: Terminal */}
          <div>
             <div className="app-right-column-header">
                <h3>Live Logs</h3>
                <p>Monitor bot activity and debugging information.</p>
             </div>
            <Terminal logs={logs} />
            
            {status === BotStatus.ERROR && (
              <div className="app-error-box">
                <strong>Connection Failed?</strong> 
                <p>
                  This is expected when running a Telegram Bot purely in the browser due to CORS. 
                  To run this bot for real:
                </p>
                <ol className="app-error-list">
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