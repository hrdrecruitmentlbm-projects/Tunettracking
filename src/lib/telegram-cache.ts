// In-memory hot-path cache for Telegram chat lookups.
//
// IMPORTANT: This is a write-through accelerator only. The DB is the source
// of truth. The webhook writes to DB (bindTelegramChat) first, then updates
// these maps. The maps are repopulated naturally on each FOC's first message
// after a server restart, so a cold start is safe (lookups fall back to DB).

const telegramChatByUsername = new Map<string, number>();
const telegramChatByUserId = new Map<string, number>();

export function cacheTelegramChat(username: string, chatId: number) {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  if (!cleanUsername) return;
  telegramChatByUsername.set(cleanUsername, chatId);
  console.log(`Cached Telegram chat: @${cleanUsername} -> ${chatId}`);
}

export function cacheUserChat(userId: string, chatId: number) {
  telegramChatByUserId.set(userId, chatId);
}

export function getTelegramChatId(username: string): number | null {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  return telegramChatByUsername.get(cleanUsername) ?? null;
}

export function getUserChatId(userId: string): number | null {
  return telegramChatByUserId.get(userId) ?? null;
}

export function clearTelegramCache() {
  telegramChatByUsername.clear();
  telegramChatByUserId.clear();
}
