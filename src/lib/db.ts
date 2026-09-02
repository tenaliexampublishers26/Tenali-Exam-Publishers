import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️ DATABASE_URL is not set in environment variables.');
}

// Reuse connection pool instance in development to prevent duplicate connections & slow handshakes
const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

export const sql =
  globalForDb.sql ??
  postgres(databaseUrl || '', {
    ssl: 'require',
    prepare: false, // Critical for Supabase transaction pooler performance
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql;
}
