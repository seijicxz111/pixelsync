import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { type Server } from "socket.io";
import { env } from "./env";
import { logger } from "./logger";

export type RedisClients = {
  pub: Redis;
  sub: Redis;
};

export async function configureRedisAdapter(io: Server): Promise<RedisClients | null> {
  if (!env.REDIS_URL) {
    logger.warn("REDIS_URL is not set; realtime server is running with an in-memory adapter.");
    return null;
  }

  const pub = new Redis(env.REDIS_URL);
  const sub = pub.duplicate();
  io.adapter(createAdapter(pub, sub));
  logger.info("Socket.IO Redis adapter configured.");
  return { pub, sub };
}
