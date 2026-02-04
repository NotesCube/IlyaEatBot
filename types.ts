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

// --- AI Response Types ---

export interface Ingredient {
  name: string;
  amount_g: number;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface NutritionData {
  per_100g: MacroNutrients;
  total: MacroNutrients;
}

// Unified response structure from the new prompts
export interface FoodAnalysisResult {
  dish?: string;
  ingredients?: Ingredient[];
  estimated_weight_g?: number;
  nutrition?: NutritionData;
  error?: boolean;
}

// --- Detailed Logging Types ---

export interface LLMMetric {
  model: string;
  response_id: string;
  latency_sec: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  status: number;
}

export interface ValidationDetails {
  was_corrected: boolean;
  correction_details: Record<string, string>; // e.g. "calories": "recalculated"
  validation_flags: Record<string, boolean>;
}

export interface PipelineLog {
  dish_analysis_pipeline: {
    image_url?: string | null;
    dish_result?: {
      dish?: string;
      ingredients?: Ingredient[];
      estimated_weight_g?: number;
    };
    nutrition_result?: NutritionData & {
      source_reference?: {
        database: string;
        version: string;
      }
    };
    validation?: ValidationDetails;
    llm_info: {
      analyzer?: LLMMetric;
      validator?: LLMMetric;
    };
    pipeline_metadata: {
      stage_order: string[];
      timestamp_utc: string;
      error: boolean;
    };
  };
}