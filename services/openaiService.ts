import { OPENAI_API_KEY, PROMPT_ANALYSIS_SYSTEM, PROMPT_NUTRITION_SYSTEM } from '../constants';
import { DishAnalysis, NutritionAnalysis } from '../types';
import { botConfig } from './configService';
import { logger } from './loggerService';

// Helper to clean JSON string if the AI wraps it in markdown code blocks
const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getModels = () => {
  if (botConfig.mode === 'DEPLOYMENT') {
    return {
      // Vision/Analysis Model
      vision: 'gpt-4o', 
      // Reasoning Model (Mapping "gpt-5-thinking" to gpt-4o or o1-preview if available)
      // Using gpt-4o as the stable fallback for "gpt-5-thinking" behavior
      reasoning: 'gpt-4o' 
    };
  }
  return {
    // TEST Mode
    // Vision: gpt-4o-mini
    vision: 'gpt-4o-mini',
    // Reasoning: Mapping "gpt-5-mini" to gpt-4o-mini
    reasoning: 'gpt-4o-mini'
  };
};

export const openaiService = {
  /**
   * Step 1: Analyze Image (or text) to get Ingredients
   */
  async analyzeDish(imageUrl: string | null, textDescription: string | null): Promise<DishAnalysis> {
    if (!imageUrl && !textDescription) throw new Error("No input provided");

    const { vision: model } = getModels();
    logger.log('info', `[OpenAI] Analyzing dish using ${model} (${botConfig.mode} mode)`);

    const content: any[] = [
      { type: "text", text: PROMPT_ANALYSIS_SYSTEM }
    ];

    if (textDescription) {
      content.push({ type: "text", text: `Описание блюда: ${textDescription}` });
    }
    
    // Pass the Image URL directly. OpenAI will download the image.
    // We do NOT send base64 data to save tokens and bandwidth.
    if (imageUrl) {
      content.push({
        type: "image_url",
        image_url: { 
          url: imageUrl,
          detail: "auto" // Let OpenAI determine resolution (low/high) based on image size
        }
      });
    }

    const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model, 
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 300,
        temperature: 0.2,
      })
    });
    const endTime = Date.now();

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Analysis Error: ${err}`);
    }

    const data = await response.json();

    // Custom logging as requested
    const logPayload = {
      response_id: data.id,
      model: data.model,
      status: response.status,
      input_tokens: data.usage?.prompt_tokens,
      output_tokens: data.usage?.completion_tokens,
      total_tokens: data.usage?.total_tokens,
      latency_sec: (endTime - startTime) / 1000,
      text: data.choices[0]?.message?.content
    };
    logger.log('info', `OpenAI Analysis Response:\n${JSON.stringify(logPayload, null, 2)}`);

    const rawContent = data.choices[0]?.message?.content || "{}";
    
    try {
      return JSON.parse(cleanJson(rawContent));
    } catch (e) {
      console.error("Failed to parse Dish Analysis JSON", rawContent);
      throw new Error("Could not parse dish analysis.");
    }
  },

  /**
   * Step 2: Calculate Nutrition from Ingredients
   */
  async calculateNutrition(dishData: DishAnalysis): Promise<NutritionAnalysis> {
    const { reasoning: model } = getModels();
    logger.log('info', `[OpenAI] Calculating nutrition using ${model} (${botConfig.mode} mode)`);

    const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model, 
        messages: [
          {
            role: "system",
            content: PROMPT_NUTRITION_SYSTEM
          },
          {
            role: "user",
            content: JSON.stringify(dishData)
          }
        ],
        max_tokens: 200,
        temperature: 0.2,
      })
    });
    const endTime = Date.now();

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Nutrition Error: ${err}`);
    }

    const data = await response.json();

    // Custom logging as requested
    const logPayload = {
      response_id: data.id,
      model: data.model,
      status: response.status,
      input_tokens: data.usage?.prompt_tokens,
      output_tokens: data.usage?.completion_tokens,
      total_tokens: data.usage?.total_tokens,
      latency_sec: (endTime - startTime) / 1000,
      text: data.choices[0]?.message?.content
    };
    logger.log('info', `OpenAI Nutrition Response:\n${JSON.stringify(logPayload, null, 2)}`);

    const rawContent = data.choices[0]?.message?.content || "{}";

    try {
      return JSON.parse(cleanJson(rawContent));
    } catch (e) {
      console.error("Failed to parse Nutrition JSON", rawContent);
      throw new Error("Could not parse nutrition data.");
    }
  }
};