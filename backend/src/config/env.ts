import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_JWT_SECRET = 'b650ac52d56cd66fe08db216b177325827893943213f47b0d4ec96558503a10e';

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  PORT: Number(process.env.PORT) || 3000,

  MONGODB_URI:
    process.env.MONGODB_URI ||
    'mongodb+srv://bhoomi2006agrawal23_db_user:bhoomi23@campuspulse.vhueuid.mongodb.net/campuspulse?retryWrites=true&w=majority',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || DEFAULT_JWT_SECRET,

  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',

  REFRESH_TOKEN_EXPIRES_DAYS: parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7',
    10
  ),

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  IMGBB_API_KEY: process.env.IMGBB_API_KEY || '',

  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,

  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
