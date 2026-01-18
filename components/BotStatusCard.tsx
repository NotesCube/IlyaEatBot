import React from 'react';
import { BotStatus, BotMode } from '../types';
import { Activity, Power, AlertTriangle, CheckCircle2, Zap, Beaker } from 'lucide-react';

interface BotStatusCardProps {
  status: BotStatus;
  mode: BotMode;
  onToggle: () => void;
  onModeChange: (mode: BotMode) => void;
  isLoading: boolean;
}

const BotStatusCard: React.FC<BotStatusCardProps> = ({ status, mode, onToggle, onModeChange, isLoading }) => {
  const isRunning = status === BotStatus.RUNNING;

  const getStatusColor = () => {
    switch (status) {
      case BotStatus.RUNNING: return 'bg-green-100 text-green-700 border-green-200';
      case BotStatus.ERROR: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (status) {
      case BotStatus.RUNNING: return <Activity className="animate-pulse" />;
      case BotStatus.ERROR: return <AlertTriangle />;
      case BotStatus.STOPPED: return <Power />;
      default: return <Power />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Bot Controller</h2>
          <p className="text-sm text-gray-500">Manage your Telegram bot instance</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor()}`}>
          {getIcon()}
          <span className="font-medium text-sm">{status}</span>
        </div>
      </div>
      
      {/* Mode Selection */}
      <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">
          AI Model Configuration
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onModeChange('TEST')}
            className={`
              relative flex flex-col items-center justify-center px-2 py-3 rounded-md border-2 transition-all w-full min-w-0
              ${mode === 'TEST' 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                : 'border-transparent bg-white text-gray-500 hover:bg-gray-100'
              }
            `}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1 font-semibold text-xs w-full">
              <Beaker size={14} className="shrink-0" /> 
              <span>TEST</span>
            </div>
            <div className="text-[10px] opacity-75 text-center leading-tight w-full break-words">
              gpt-4o-mini + <br/> gpt-5-mini
            </div>
            {mode === 'TEST' && (
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            )}
          </button>

          <button
             onClick={() => onModeChange('DEPLOYMENT')}
             className={`
              relative flex flex-col items-center justify-center px-2 py-3 rounded-md border-2 transition-all w-full min-w-0
              ${mode === 'DEPLOYMENT' 
                ? 'border-purple-500 bg-purple-50 text-purple-700' 
                : 'border-transparent bg-white text-gray-500 hover:bg-gray-100'
              }
            `}
          >
             <div className="flex items-center justify-center gap-1.5 mb-1 font-semibold text-xs w-full">
              <Zap size={14} className="shrink-0" /> 
              <span>DEPLOYMENT</span>
            </div>
            <div className="text-[9px] opacity-75 text-center leading-tight w-full break-all">
              gpt-4o + <br/> gpt-5-thinking
            </div>
            {mode === 'DEPLOYMENT' && (
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            )}
          </button>
        </div>
      </div>

      {/* Main Action */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          disabled={isLoading}
          className={`
            flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all w-full
            ${isRunning 
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <span className="animate-spin text-xl">↻</span>
          ) : isRunning ? (
            <>
              <Power size={18} /> Stop Bot
            </>
          ) : (
            <>
              <CheckCircle2 size={18} /> Start Bot
            </>
          )}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
        <strong>Note:</strong> Starting the bot here attempts to run the <code>grammY</code> logic in your browser. 
        Due to Telegram API CORS restrictions, this may fail without a proxy. 
        In production, deploy the code in <code>services/</code> to a Node.js server.
      </div>
    </div>
  );
};

export default BotStatusCard;