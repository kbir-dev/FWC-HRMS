import { createClient } from 'redis';
import { config } from '../config/index.js';

// Create Redis client
const redisClient = createClient({
  url: config.redis.url
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect to Redis
await redisClient.connect();

export default redisClient;

