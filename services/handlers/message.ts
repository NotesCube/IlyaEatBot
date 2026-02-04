import { Context } from 'grammy';
import { TELEGRAM_BOT_TOKEN, CALCULATE_BUTTON_TEXT } from '../../constants';
import { openaiService } from '../openaiService';
import { logger } from '../loggerService';

export const handleMessage = async (ctx: Context) => {
  const photo = ctx.message?.photo;
  const text = ctx.message?.text;

  // 1. Validation: Ensure we have content
  if (!photo && !text) return;

  // 2. Filter: Ignore if the text matches our navigation buttons (handled by botService.hears)
  if (text === CALCULATE_BUTTON_TEXT) return;

  // Let the user know we are thinking
  const loadingMsg = await ctx.reply("⏳ Анализирую блюдо и считаю калории...");

  try {
    let imageUrl: string | null = null;

    // 1. Get Image URL if photo exists
    if (photo) {
      const fileId = photo[photo.length - 1].file_id;
      const file = await ctx.api.getFile(fileId);
      
      if (file.file_path) {
        imageUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
        logger.log('info', `Generated Image URL for OpenAI: ${imageUrl}`);
      } else {
        logger.log('error', 'Could not retrieve file_path from Telegram API');
        await ctx.api.editMessageText(
          ctx.chat!.id, 
          loadingMsg.message_id, 
          "❌ Ошибка: не удалось получить ссылку на фото."
        );
        return;
      }
    }

    // 2. Single Step Analysis (Dish + Nutrition)
    const result = await openaiService.analyzeFood(imageUrl, text || null);
    
    logger.log('info', `🧠 AI Full Result:\n${JSON.stringify(result, null, 2)}`);

    // Check errors
    if (result.error || !result.dish || !result.nutrition) {
       await ctx.api.editMessageText(
        ctx.chat!.id, 
        loadingMsg.message_id, 
        "😕 Блюдо не распознано. Пожалуйста, убедитесь, что на фото еда, или уточните описание."
      );
      logger.log('warn', 'AI returned error for analysis.');
      return;
    }

    // 3. Format Output
    const { total, per_100g } = result.nutrition;
    
    const responseText = `
🍽 *${result.dish}* (~${result.estimated_weight_g}г)

*На всю порцию:*
🔥 Калории: *${total.calories} ккал*
🥩 Белки: ${total.protein} г
🥑 Жиры: ${total.fat} г
🥖 Углеводы: ${total.carbs} г

*На 100г:*
🔥 ${per_100g.calories} ккал | Б: ${per_100g.protein} | Ж: ${per_100g.fat} | У: ${per_100g.carbs}
`;

    logger.log('success', `🤖 Sending Reply:\n${responseText.trim()}`);

    // 4. Final Reply
    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
    await ctx.reply(responseText, { 
      parse_mode: "Markdown",
      reply_to_message_id: ctx.message?.message_id 
    });

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    logger.log('error', `Pipeline Error: ${error.message}`);
    await ctx.api.editMessageText(
      ctx.chat!.id, 
      loadingMsg.message_id, 
      `❌ Произошла ошибка: ${error.message}`
    );
  }
};