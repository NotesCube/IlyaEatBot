import { LogEntry } from '../types';

type LogCallback = (entry: LogEntry) => void;

class LoggerService {
  private subscriber: LogCallback | null = null;

  public subscribe(callback: LogCallback) {
    this.subscriber = callback;
  }

  public log(level: LogEntry['level'], message: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      level,
      message,
    };
    
    // Console fallback for debugging
    const prefix = `[Logger] ${level.toUpperCase()}:`;
    if (level === 'error') console.error(prefix, message);
    else console.log(prefix, message);

    if (this.subscriber) {
      this.subscriber(entry);
    }
  }
}

export const logger = new LoggerService();