import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://hrms_user:hrms_password@localhost:5432/hrms_db'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },
  
  ai: {
    provider: process.env.AI_PROVIDER || 'openrouter', // openrouter (free!), gemini, huggingface, openai
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || ''
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || ''
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
      embeddingModel: process.env.HF_EMBEDDING_MODEL || 'sentence-transformers/all-mpnet-base-v2'
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || ''
    },
    embeddingDimension: 768 // default for all-mpnet-base-v2 and similar models
  },
  
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local', // local, s3, supabase
    local: {
      uploadDir: process.env.UPLOAD_DIR || './uploads'
    },
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
};

