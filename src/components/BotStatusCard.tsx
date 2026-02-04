import React from "react";
import { BotStatus, BotMode } from "../../types";
import {
  Activity,
  Power,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Beaker,
} from "lucide-react";
import styles from "./BotStatusCard.module.css";

interface BotStatusCardProps {
  status: BotStatus;
  mode: BotMode;
  onToggle: () => void;
  onModeChange: (mode: BotMode) => void;
  isLoading: boolean;
}

const BotStatusCard: React.FC<BotStatusCardProps> = ({
  status,
  mode,
  onToggle,
  onModeChange,
  isLoading,
}) => {
  const isRunning = status === BotStatus.RUNNING;

  const getStatusClass = () => {
    switch (status) {
      case BotStatus.RUNNING:
        return styles.bscStatusRunning;
      case BotStatus.ERROR:
        return styles.bscStatusError;
      default:
        return styles.bscStatusDefault;
    }
  };

  const getIcon = () => {
    switch (status) {
      case BotStatus.RUNNING:
        return <Activity className={styles.animatePulse} />;
      case BotStatus.ERROR:
        return <AlertTriangle />;
      case BotStatus.STOPPED:
        return <Power />;
      default:
        return <Power />;
    }
  };

  return (
    <div className={styles.bscCard}>
      {/* Header */}
      <div className={styles.bscHeader}>
        <div>
          <h2 className={styles.bscTitle}>Bot Controller</h2>
          <p className={styles.bscSubtitle}>
            Manage your Telegram bot instance
          </p>
        </div>
        <div className={`${styles.bscStatusBadge} ${getStatusClass()}`}>
          {getIcon()}
          <span>{status}</span>
        </div>
      </div>

      {/* Mode Selection */}
      <div className={styles.bscModeContainer}>
        <label className={styles.bscModeLabel}>AI Model Configuration</label>
        <div className={styles.bscGrid}>
          <button
            onClick={() => onModeChange("TEST")}
            className={`${styles.bscModeBtn} ${
              mode === "TEST"
                ? styles.bscModeBtnTest
                : styles.bscModeBtnInactive
            }`}
          >
            <div className={styles.bscModeContent}>
              <Beaker size={14} className={styles.shrink0} />
              <span>TEST</span>
            </div>
            <div className={styles.bscModeSubtext}>gpt-4o-mini</div>
            {mode === "TEST" && (
              <div
                className={`${styles.bscActiveDot} ${styles.bscDotIndigo}`}
              ></div>
            )}
          </button>

          <button
            onClick={() => onModeChange("DEPLOYMENT")}
            className={`${styles.bscModeBtn} ${
              mode === "DEPLOYMENT"
                ? styles.bscModeBtnDeploy
                : styles.bscModeBtnInactive
            }`}
          >
            <div className={styles.bscModeContent}>
              <Zap size={14} className={styles.shrink0} />
              <span>DEPLOYMENT</span>
            </div>
            <div className={styles.bscModeSubtext}>gpt-4o</div>
            {mode === "DEPLOYMENT" && (
              <div
                className={`${styles.bscActiveDot} ${styles.bscDotPurple}`}
              ></div>
            )}
          </button>
        </div>
      </div>

      {/* Main Action */}
      <div className={styles.bscActions}>
        <button
          onClick={onToggle}
          disabled={isLoading}
          className={`${styles.bscMainButton} ${
            isRunning ? styles.bscBtnStop : styles.bscBtnStart
          } ${isLoading ? styles.bscBtnLoading : ""}`}
        >
          {isLoading ? (
            <span className={`${styles.animateSpin} text-xl`}>↻</span>
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
