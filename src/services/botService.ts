import { Bot, Context, Keyboard } from 'grammy';
import { 
  TELEGRAM_BOT_TOKEN, 
  CALCULATE_BUTTON_TEXT, 
  WELCOME_MESSAGE, 
  WAITING_FOR_INPUT_RESPONSE 
} from '../constants';
import { handleMessage } from './handlers/message';
import { logger } from './loggerService';

// Standard Context without Session
type MyContext = Context;

class BotService {
  private bot: Bot<MyContext> | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.bot = null;
  }

  public async start() {
    if (this.bot) {
      logger.log('warn', 'Bot is already running');
      return;
    }

    try {
      logger.log('info', 'Initializing CalorieBot...');
      this.bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);
      
      // 1. Logging Middleware
      this.bot.use(async (ctx, next) => {
        const user = ctx.from?.first_name || 'Unknown';
        // Only log if not just spamming typing events
        if (ctx.message || ctx.callbackQuery) {
          logger.log('info', `Received update from ${user} [ID: ${ctx.from?.id}]`);
        }
        await next();
      });

      // --- COMMANDS ---

      // Start command
      this.bot.command("start", async (ctx) => {
        const userId = ctx.from?.id;
        if (!userId) return;
        
        logger.log('info', `User ${userId} started the bot.`);
        
        const keyboard = new Keyboard()
          .text(CALCULATE_BUTTON_TEXT)
          .resized();
        
        await ctx.reply(WELCOME_MESSAGE, { 
          reply_markup: keyboard,
          parse_mode: "Markdown"
        });
      });

      // Define Calculate Logic (Used for Button and Command)
      const onCalculate = async (ctx: Context) => {
        logger.log('info', `Processing Calculate request from ${ctx.from?.first_name}`);
        await ctx.reply(WAITING_FOR_INPUT_RESPONSE);
      };

      // Handle the Keyboard Button click (matches the text)
      this.bot.hears(CALCULATE_BUTTON_TEXT, onCalculate);

      // Keep /calculate as a fallback command
      this.bot.command("calculate", onCalculate);

      // --- GENERAL MESSAGES ---
      // Complex message handling (AI analysis) stays in its own file
      this.bot.on(["message:photo", "message:text"], async (ctx) => {
         return handleMessage(ctx);
      });

      // Error Handling
      this.bot.catch((err) => {
        logger.log('error', `Bot error: ${err.message}`);
      });
      
      // Set the menu commands
      logger.log('info', 'Setting up bot menu commands...');
      await this.bot.api.setMyCommands([
        { command: "start", description: "Запустить / Главная" },
      ]);
      logger.log('success', 'Menu commands set.');

      // Start polling
      this.abortController = new AbortController();
      
      await this.bot.init();
      logger.log('success', `Bot connected as @${this.bot.botInfo.username}`);

      // Start the long-polling loop
      this.bot.start({
        allowed_updates: ["message", "callback_query"],
        onStart: () => {
           // Info already logged via init
        }
      }).catch((err) => {
         if (this.bot) { 
             logger.log('error', `Polling error: ${err.message}`);
         }
      });

    } catch (error: any) {
      logger.log('error', `Failed to start bot: ${error.message || error}`);
      if (error.message && error.message.includes('fetch')) {
         logger.log('warn', 'CORS Error detected. Telegram Bots usually require a Node.js backend.');
      }
      this.stop();
      throw error;
    }
  }

  public async stop() {
    if (this.bot) {
      logger.log('info', 'Stopping bot...');
      try {
        await this.bot.stop();
      } catch (e) { 
        // Ignore stop errors
      }
      this.bot = null;
      logger.log('info', 'Bot stopped.');
    }
  }
}

export const botService = new BotService();