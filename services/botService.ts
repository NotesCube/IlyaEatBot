import { Bot, Context } from 'grammy';
import { TELEGRAM_BOT_TOKEN, WELCOME_MESSAGE } from '../constants';
import { handleCalculateCommand } from './handlers/calculate';
import { handleMessage } from './handlers/message';
import { logger } from './loggerService';

// Define a custom context if needed in the future
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
      
      // Middleware for logging
      this.bot.use(async (ctx, next) => {
        const user = ctx.from?.first_name || 'Unknown';
        logger.log('info', `Received update from ${user} [ID: ${ctx.from?.id}]`);
        await next();
      });

      // Command Handlers
      this.bot.command("start", (ctx) => ctx.reply(WELCOME_MESSAGE));
      this.bot.command("calculate", (ctx) => {
        logger.log('info', `Processing /calculate command from ${ctx.from?.first_name}`);
        return handleCalculateCommand(ctx);
      });

      // Message Handlers
      this.bot.on(["message:photo", "message:text"], (ctx) => {
        logger.log('info', `Processing message from ${ctx.from?.first_name}`);
        return handleMessage(ctx);
      });

      // Error Handling
      this.bot.catch((err) => {
        logger.log('error', `Bot error: ${err.message}`);
      });
      
      // Set the menu commands
      logger.log('info', 'Setting up bot menu commands...');
      await this.bot.api.setMyCommands([
        { command: "start", description: "Запустить бота" },
        { command: "calculate", description: "Посчитать калории" },
      ]);
      logger.log('success', 'Menu commands set.');

      // Start polling
      // Note: In a browser environment, polling standard Telegram API might hit CORS.
      // We wrap this in a try/catch to inform the user if it fails.
      this.abortController = new AbortController();
      
      // Initialize to ensure connection is valid before returning "success" to the UI
      await this.bot.init();
      logger.log('success', `Bot connected as @${this.bot.botInfo.username}`);

      // Start the long-polling loop WITHOUT awaiting it (non-blocking)
      // If we await this, the UI button will spin forever because bot.start() never resolves until stop()
      this.bot.start({
        allowed_updates: ["message", "callback_query"],
        onStart: () => {
           // Info already logged via init
        }
      }).catch((err) => {
         // Capture errors that occur during the long-polling loop
         if (this.bot) { // Only log if we didn't intentionally stop it
             logger.log('error', `Polling error: ${err.message}`);
         }
      });

    } catch (error: any) {
      logger.log('error', `Failed to start bot: ${error.message || error}`);
      if (error.message && error.message.includes('fetch')) {
         logger.log('warn', 'CORS Error detected. Telegram Bots usually require a Node.js backend. This dashboard demonstrates the logic structure.');
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