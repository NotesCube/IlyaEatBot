import { Context } from 'grammy';
import { TELEGRAM_BOT_TOKEN } from '../../constants';
import { openaiService } from '../openaiService';
import { logger } from '../loggerService';

export const handleMessage = async (ctx: Context) => {
  const photo = ctx.message?.photo;
  const text = ctx.message?.text;

  // Only process if it looks like a food query (photo or text)
  if (!photo && !text) return;

  // Let the user know we are thinking
  const loadingMsg = await ctx.reply("⏳ Анализирую блюдо...");

  try {
    let imageUrl: string | null = null;

    // 1. Get Image URL if photo exists
    if (photo) {
      // Get the largest file (highest resolution)
      const fileId = photo[photo.length - 1].file_id;
      
      // Get file path from Telegram API
      // This returns a File object with file_path, it does NOT download the content yet.
      const file = await ctx.api.getFile(fileId);
      
      if (file.file_path) {
        // Construct the direct URL to the file on Telegram servers
        // OpenAI will download the image from this URL directly
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

    // 2. Step 1: Analyze Dish (Structure)
    // We pass the URL, not base64 data
    const dishAnalysis = await openaiService.analyzeDish(imageUrl, text || null);
    
    // Check if AI failed to identify the dish
    if (dishAnalysis.error || !dishAnalysis.dish || !dishAnalysis.estimated_weight_g) {
       await ctx.api.editMessageText(
        ctx.chat!.id, 
        loadingMsg.message_id, 
        "😕 Блюдо не распознано. Попробуйте еще раз (фото должно быть четким, или добавьте описание)."
      );
      return;
    }

    await ctx.api.editMessageText(
      ctx.chat!.id, 
      loadingMsg.message_id, 
      `🥣 Блюдо определено: *${dishAnalysis.dish}*\n⚖️ Примерный вес: ${dishAnalysis.estimated_weight_g}г\n\nСчитаю калории...`,
      { parse_mode: "Markdown" }
    );

    // 3. Step 2: Calculate Nutrition
    const nutrition = await openaiService.calculateNutrition(dishAnalysis);

    // 4. Format Output
    const { total, per_100g } = nutrition;
    
    const responseText = `
🍽 *${dishAnalysis.dish}* (~${dishAnalysis.estimated_weight_g}г)

*На всю порцию:*
🔥 Калории: *${total.calories} ккал*
🥩 Белки: ${total.protein} г
🥑 Жиры: ${total.fat} г
🥖 Углеводы: ${total.carbs} г

*На 100г:*
🔥 ${per_100g.calories} ккал | Б: ${per_100g.protein} | Ж: ${per_100g.fat} | У: ${per_100g.carbs}
`;

    // 5. Final Reply
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
      `❌ Произошла ошибка при анализе: ${error.message}`
    );
  }
};