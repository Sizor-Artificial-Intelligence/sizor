export type ReactionLike = {
  id?: string;
  emoji?: string;
  senderId?: string;
  action?: string | null; // "react" | "unreact"
};

export type ReactionBadge = {
  emoji: string;
  count: number;
  senderIds: string[];
};

/**
 * Build UI-ready reaction badges from raw reactions.
 * - Only includes active reactions (`action !== "unreact"`).
 * - Groups by emoji and returns count per emoji.
 */
export function getReactionBadges(
  reactions?: ReactionLike[] | null
): ReactionBadge[] {
  if (!reactions || reactions.length === 0) return [];

  const map = new Map<string, { count: number; senderIds: Set<string> }>();

  for (const reaction of reactions) {
    const emoji = typeof reaction?.emoji === "string" ? reaction.emoji : "";
    if (!emoji) continue;

    const actionRaw =
      typeof reaction?.action === "string" ? reaction.action : "react";
    const action = actionRaw.toLowerCase();
    if (action === "unreact") continue;

    const senderId =
      typeof reaction?.senderId === "string" ? reaction.senderId : "";

    const existing = map.get(emoji) ?? { count: 0, senderIds: new Set() };

    // Avoid double-counting same sender for same emoji (should be unique, but safe)
    if (senderId) {
      if (!existing.senderIds.has(senderId)) {
        existing.senderIds.add(senderId);
        existing.count += 1;
      }
    } else {
      existing.count += 1;
    }

    map.set(emoji, existing);
  }

  return Array.from(map.entries())
    .map(([emoji, data]) => ({
      emoji,
      count: data.count,
      senderIds: Array.from(data.senderIds),
    }))
    .sort((a, b) => b.count - a.count);
}
