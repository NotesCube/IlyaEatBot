import React from 'react';
import { BotStatus, BotMode } from '../types';
import { Activity, Power, AlertTriangle, CheckCircle2, Zap, Beaker } from 'lucide-react';
import './BotStatusCard.module.css';

interface BotStatusCardProps {
  status: BotStatus;
  mode: BotMode;
  onToggle: () => void;
  onModeChange: (mode: BotMode) => void;
  isLoading: boolean;
}

const BotStatusCard: React.FC<BotStatusCardProps> = ({ status, mode, onToggle, onModeChange, isLoading }) => {
  const isRunning = status === BotStatus.RUNNING;

  const getStatusClass = () => {
    switch (status) {
      case BotStatus.RUNNING: return 'bsc-status-running';
      case BotStatus.ERROR: return 'bsc-status-error';
      default: return 'bsc-status-default';
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
    <div className="bsc-card">
      {/* Header */}
      <div className="bsc-header">
        <div>
          <h2 className="bsc-title">Bot Controller</h2>
          <p className="bsc-subtitle">Manage your Telegram bot instance</p>
        </div>
        <div className={`bsc-status-badge ${getStatusClass()}`}>
          {getIcon()}
          <span>{status}</span>
        </div>
      </div>
      
      {/* Mode Selection */}
      <div className="bsc-mode-container">
        <label className="bsc-mode-label">
          AI Model Configuration
        </label>
        <div className="bsc-grid">
          <button
            onClick={() => onModeChange('TEST')}
            className={`bsc-mode-btn ${mode === 'TEST' ? 'bsc-mode-btn-test' : 'bsc-mode-btn-inactive'}`}
          >
            <div className="bsc-mode-content">
              <Beaker size={14} className="shrink-0" /> 
              <span>TEST</span>
            </div>
            <div className="bsc-mode-subtext">
              gpt-4o-mini
            </div>
            {mode === 'TEST' && (
              <div className="bsc-active-dot bsc-dot-indigo"></div>
            )}
          </button>

          <button
             onClick={() => onModeChange('DEPLOYMENT')}
             className={`bsc-mode-btn ${mode === 'DEPLOYMENT' ? 'bsc-mode-btn-deploy' : 'bsc-mode-btn-inactive'}`}
          >
             <div className="bsc-mode-content">
              <Zap size={14} className="shrink-0" /> 
              <span>DEPLOYMENT</span>
            </div>
            <div className="bsc-mode-subtext">
              gpt-4o
            </div>
            {mode === 'DEPLOYMENT' && (
              <div className="bsc-active-dot bsc-dot-purple"></div>
            )}
          </button>
        </div>
      </div>

      {/* Main Action */}
      <div className="bsc-actions">
        <button
          onClick={onToggle}
          disabled={isLoading}
          className={`
            bsc-main-button 
            ${isRunning ? 'bsc-btn-stop' : 'bsc-btn-start'}
            ${isLoading ? 'bsc-btn-loading' : ''}
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
    </div>
  );
};

export default BotStatusCard;