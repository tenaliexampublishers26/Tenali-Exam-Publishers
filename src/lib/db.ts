import postgres from 'postgres';

const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

function getDb() {
  if (!globalForDb.sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set in environment variables.');
    }
    globalForDb.sql = postgres(databaseUrl, {
      ssl: 'require',
      prepare: false, // Critical for Supabase transaction pooler performance
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
    });
  }
  return globalForDb.sql;
}

// Lazy Proxy: only creates database connection when an actual query is executed at runtime
export const sql = new Proxy((() => {}) as unknown as ReturnType<typeof postgres>, {
  apply(_target, thisArg, argArray) {
    const db = getDb();
    return (db as any).apply(thisArg, argArray);
  },
  get(_target, prop) {
    const db = getDb();
    const value = (db as any)[prop];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  },
});
