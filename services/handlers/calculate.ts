import { Context } from 'grammy';
import { WAITING_FOR_INPUT_RESPONSE } from '../../constants';

export const handleCalculateCommand = async (ctx: Context) => {
  // In a real database, we would set a flag like 'waitingForInput' for this user
  await ctx.reply(WAITING_FOR_INPUT_RESPONSE);
};