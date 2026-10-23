import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  databaseUrl: process.env.DATABASE_URL || '',
  maxNumberLimit: parseInt(process.env.MAX_NUMBER_LIMIT || '500', 10),
  reconnectionGracePeriodMs: parseInt(process.env.RECONNECTION_GRACE_PERIOD_MS || '60000', 10),
};
