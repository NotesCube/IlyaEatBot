import React, { useEffect, useRef } from "react";
import { LogEntry } from "../../types";
import { Terminal as TerminalIcon } from "lucide-react";
import styles from "./Terminal.module.css";

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

  const getColorClass = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return styles.termTextInfo;
      case "warn":
        return styles.termTextWarn;
      case "error":
        return styles.termTextError;
      case "success":
        return styles.termTextSuccess;
      default:
        return styles.termTextDefault;
    }
  };

  return (
    <div className={styles.termContainer}>
      <div className={styles.termHeader}>
        <div className={styles.termTitleSection}>
          <TerminalIcon
            size={16}
            className={styles.termTextDefault}
            style={{ color: "#9ca3af" }}
          />
          <span className={styles.termTitle}>Bot Console Output</span>
        </div>
        <div className={styles.termControls}>
          <div className={`${styles.termDot} ${styles.termDotRed}`}></div>
          <div className={`${styles.termDot} ${styles.termDotYellow}`}></div>
          <div className={`${styles.termDot} ${styles.termDotGreen}`}></div>
        </div>
      </div>
      <div ref={scrollRef} className={styles.termContent}>
        {logs.length === 0 && (
          <div className={styles.termEmptyState}>Waiting for bot logs...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={styles.termLogEntry}>
            <span className={styles.termTimestamp}>
              [{log.timestamp.toLocaleTimeString()}]
            </span>
            <span
              className={`${styles.termMessage} ${getColorClass(log.level)}`}
            >
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
