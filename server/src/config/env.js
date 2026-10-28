import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/billbook_dev?retryWrites=true&w=majority',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_secret_key_access_at_least_32_characters_1234567890',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_secret_key_refresh_at_least_32_characters_1234567890',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
};
