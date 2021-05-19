import TelegramBot from 'node-telegram-bot-api';

// replace the value below with the Telegram token you receive from @BotFather
const token = '1842704305:AAEj9rphZDB3Q7uYunqiPooisfZJsGvMDwE';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const subscribers = new Set<number>();
bot.onText(/\/subscribe/, (msg) => {
  const chatId = msg.chat.id;
  subscribers.add(chatId);

  bot.sendMessage(chatId, 'Successfully subscribed!');
});

function broadcastToSubscribers(message: string): void {
  subscribers.forEach((chatId) => {
    bot.sendMessage(chatId, message);
  });
}

export { bot, broadcastToSubscribers };
