// In-memory cache of Telegram username -> chat_id
// Populated when users message the bot via webhook
// Used to send notifications back to FOC when NOC assigns tasks

const telegramChatCache = new Map<string, number>();

export function cacheTelegramChat(username: string, chatId: number) {
  const cleanUsername = username.replace("@", "").trim().toLowerCase();
  telegramChatCache.set(cleanUsername, chatId);
  console.log(`Cached Telegram chat: @${cleanUsername} -> ${chatId}`);
}

export function getTelegramChatId(username: string): number | null {
  const cleanUsername = username.replace("@", "").trim().toLowerCase();
  return telegramChatCache.get(cleanUsername) || null;
}
