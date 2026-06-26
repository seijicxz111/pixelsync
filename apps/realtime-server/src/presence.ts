import { type RedisClients } from "./redis";
import { type PresenceUser } from "@pixelsync/shared";

const ttlSeconds = 35;

export class PresenceStore {
  private readonly memory = new Map<string, Map<string, PresenceUser>>();

  public constructor(private readonly redis: RedisClients | null) {}

  public async set(roomId: string, presence: PresenceUser): Promise<void> {
    if (this.redis !== null) {
      await this.redis.pub.setex(this.key(roomId, presence.userId), ttlSeconds, JSON.stringify(presence));
    }

    const room = this.memory.get(roomId) ?? new Map<string, PresenceUser>();
    room.set(presence.userId, presence);
    this.memory.set(roomId, room);
  }

  public async delete(roomId: string, userId: string): Promise<void> {
    if (this.redis !== null) {
      await this.redis.pub.del(this.key(roomId, userId));
    }

    this.memory.get(roomId)?.delete(userId);
  }

  public async list(roomId: string): Promise<PresenceUser[]> {
    if (this.redis !== null) {
      const keys = await this.redis.pub.keys(this.key(roomId, "*"));
      if (keys.length > 0) {
        const values = await this.redis.pub.mget(keys);
        return values
          .filter((value): value is string => value !== null)
          .map((value) => JSON.parse(value) as PresenceUser);
      }
    }

    return [...(this.memory.get(roomId)?.values() ?? [])];
  }

  private key(roomId: string, userId: string): string {
    return `presence:${roomId}:${userId}`;
  }
}
