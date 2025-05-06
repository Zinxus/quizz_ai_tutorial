import 'dotenv/config';
import fs from 'fs';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com', 
    port: 6543, 
    user: 'postgres.eozxryhihgnahbcnubfb', 
    password: '5a3rmOzlxdEDC7uj', 
    database: 'postgres', 
    ssl: {
      ca: fs.readFileSync('./certs/prod-ca-2021.crt').toString(),
    },
  },
} satisfies Config;