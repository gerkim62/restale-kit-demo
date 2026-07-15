import { SSEChannelGroup } from 'restale-kit/server';
import { redisPubSubAdapter } from 'restale-kit/redis';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let pubsub;
if (process.env.REDIS_URL) {
  console.log('Connecting to Redis...');
  const redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });
  pubsub = redisPubSubAdapter(redisClient);
} else {
  console.log('Redis URL not configured. Running in single-instance mode (no Pub/Sub).');
}

export const sseGroup = new SSEChannelGroup({ pubsub, eventBufferCapacity: 100 });
