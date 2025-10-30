import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import redisClient from './redis.js';

// Generate access token
export const generateAccessToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );
};

// Store refresh token in Redis
export const storeRefreshToken = async (userId, refreshToken) => {
  const key = `refresh_token:${userId}`;
  await redisClient.set(key, refreshToken, {
    EX: 7 * 24 * 60 * 60 // 7 days in seconds
  });
};

// Verify refresh token
export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Check if token exists in Redis
    const key = `refresh_token:${decoded.userId}`;
    const storedToken = await redisClient.get(key);
    
    if (storedToken !== refreshToken) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

// Revoke refresh token
export const revokeRefreshToken = async (userId) => {
  const key = `refresh_token:${userId}`;
  await redisClient.del(key);
};

