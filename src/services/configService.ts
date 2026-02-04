import { BotMode } from '../types';

// Singleton configuration to be shared between React components and non-React services
export const botConfig = {
  mode: 'TEST' as BotMode
};

export const setBotMode = (mode: BotMode) => {
  botConfig.mode = mode;
  console.log(`[Config] Switched to ${mode} mode`);
};