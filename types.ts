export enum BotStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
  STOPPED = 'STOPPED'
}

export type BotMode = 'TEST' | 'DEPLOYMENT';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface BotState {
  status: BotStatus;
  lastUpdate: Date | null;
  processedCount: number;
}

// AI Response Types

export interface Ingredient {
  name: string;
  amount_g: number;
}

export interface DishAnalysis {
  dish?: string;
  ingredients?: Ingredient[];
  estimated_weight_g?: number;
  error?: boolean;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface NutritionAnalysis {
  per_100g: MacroNutrients;
  total: MacroNutrients;
}