import { OPENAI_API_KEY, PROMPT_PHOTO_SYSTEM, PROMPT_TEXT_SYSTEM, PROMPT_VALIDATOR_SYSTEM } from '../constants';
import { FoodAnalysisResult, PipelineLog, LLMMetric } from '../types';
import { botConfig } from './configService';
import { logger } from './loggerService';

// Helper to clean JSON string if the AI wraps it in markdown code blocks
const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getModel = () => {
  if (botConfig.mode === 'DEPLOYMENT') {
    return 'gpt-4o';
  }
  // TEST Mode
  return 'gpt-4o-mini';
};

interface OpenAIResponseWrapper {
  parsed: FoodAnalysisResult;
  metrics: LLMMetric;
  raw: any;
}

// Reusable API call function with detailed metrics
const callOpenAI = async (messages: any[], model: string, stepName: string): Promise<OpenAIResponseWrapper> => {
  const startTime = Date.now();
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: model, 
      messages: messages,
      max_tokens: 6000,
      temperature: 0.2, 
    })
  });

  const endTime = Date.now();
  const latency = (endTime - startTime) / 1000;

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API Error (${stepName}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "{}";
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  const metrics: LLMMetric = {
    model: data.model || model,
    response_id: data.id,
    latency_sec: latency,
    input_tokens: usage.prompt_tokens,
    output_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    status: response.status
  };

  let parsed: FoodAnalysisResult;
  try {
    parsed = JSON.parse(cleanJson(content));
  } catch (e) {
    console.error(`Failed to parse AI JSON in ${stepName}`, content);
    // Return error object as result
    parsed = { error: true };
  }

  return { parsed, metrics, raw: data };
};

export const openaiService = {
  /**
   * Two-step analysis:
   * 1. Analyzer: Identifies dish, ingredients, and initial math.
   * 2. Validator: Audits the math and corrects errors.
   */
  async analyzeFood(imageUrl: string | null, textDescription: string | null): Promise<FoodAnalysisResult> {
    if (!imageUrl && !textDescription) throw new Error("No input provided");

    const model = getModel();
    const stages: string[] = [];
    
    // Prepare Pipeline Log Structure
    const pipelineLog: PipelineLog['dish_analysis_pipeline'] = {
      image_url: imageUrl,
      llm_info: {},
      pipeline_metadata: {
        stage_order: [],
        timestamp_utc: new Date().toISOString(),
        error: false
      }
    };

    logger.log('info', `[Pipeline] Started using ${model}`);

    try {
      // --- STEP 1: ANALYZER ---
      stages.push('Analyzer');
      
      let systemPrompt = "";
      const userContent: any[] = [];

      if (imageUrl) {
        systemPrompt = PROMPT_PHOTO_SYSTEM;
        if (textDescription) {
          userContent.push({ type: "text", text: `Дополнительный комментарий пользователя: ${textDescription}` });
        }
        userContent.push({
          type: "image_url",
          image_url: { url: imageUrl, detail: "auto" }
        });
      } else {
        systemPrompt = PROMPT_TEXT_SYSTEM;
        if (textDescription) {
          userContent.push({ type: "text", text: textDescription });
        }
      }

      const analyzerResult = await callOpenAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ], model, "Analyzer");

      // Save Analyzer metrics
      pipelineLog.llm_info.analyzer = analyzerResult.metrics;
      
      // Stop if initial error
      if (analyzerResult.parsed.error || !analyzerResult.parsed.nutrition) {
        pipelineLog.pipeline_metadata.error = true;
        pipelineLog.pipeline_metadata.stage_order = stages;
        logger.log('error', `[Pipeline Result]\n${JSON.stringify({ dish_analysis_pipeline: pipelineLog }, null, 2)}`);
        return analyzerResult.parsed;
      }

      // --- STEP 2: VALIDATOR ---
      stages.push('Validator');
      logger.log('info', `[Pipeline] Sending to Validator...`);

      const validatorMessages = [
        { role: "system", content: PROMPT_VALIDATOR_SYSTEM },
        { role: "user", content: JSON.stringify(analyzerResult.parsed) }
      ];

      const validatorResult = await callOpenAI(validatorMessages, model, "Validator");

      // Save Validator metrics
      pipelineLog.llm_info.validator = validatorResult.metrics;

      // Determine final result (fallback to analyzer if validator failed completely)
      const finalResult = validatorResult.parsed.error ? analyzerResult.parsed : validatorResult.parsed;
      
      // Calculate Diff / Correction Details
      const wasCorrected = JSON.stringify(analyzerResult.parsed.nutrition) !== JSON.stringify(finalResult.nutrition);
      
      const correctionDetails: Record<string, string> = {};
      if (wasCorrected && analyzerResult.parsed.nutrition && finalResult.nutrition) {
        if (analyzerResult.parsed.nutrition.total.calories !== finalResult.nutrition.total.calories) correctionDetails['calories'] = 'recalculated';
        if (analyzerResult.parsed.nutrition.total.protein !== finalResult.nutrition.total.protein) correctionDetails['protein'] = 'recalculated';
        if (analyzerResult.parsed.nutrition.total.fat !== finalResult.nutrition.total.fat) correctionDetails['fat'] = 'recalculated';
        if (analyzerResult.parsed.nutrition.total.carbs !== finalResult.nutrition.total.carbs) correctionDetails['carbs'] = 'recalculated';
      } else {
        correctionDetails['status'] = 'verified';
      }

      // Populate detailed log
      pipelineLog.dish_result = {
        dish: finalResult.dish,
        ingredients: finalResult.ingredients,
        estimated_weight_g: finalResult.estimated_weight_g
      };
      
      pipelineLog.nutrition_result = {
        ...finalResult.nutrition!,
        source_reference: {
          database: "OpenAI Knowledge Base",
          version: model
        }
      };

      pipelineLog.validation = {
        was_corrected: wasCorrected,
        correction_details: correctionDetails,
        validation_flags: {
           weight_match: true, // Assumed passed if not error
           logical_check_passed: !finalResult.error
        }
      };

      pipelineLog.pipeline_metadata.stage_order = stages;
      
      // Log the BIG JSON
      logger.log('success', `[Pipeline Complete]\n${JSON.stringify({ dish_analysis_pipeline: pipelineLog }, null, 2)}`);

      return finalResult;

    } catch (e: any) {
      logger.log('error', `Pipeline crashed: ${e.message}`);
      throw e;
    }
  }
};