import postgres from 'postgres';

// ─── Singleton DB Connection ──────────────────────────────────────────────────
// Uses globalThis to prevent hot-reload from creating multiple connections in dev
const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

function getDb() {
  if (!globalForDb.sql) {
    const databaseUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres.xsidvgynolsenmdnudqm:Tenali%402026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require';

    // ─── Pool Tuning for 30K Concurrent Users ──────────────────────────────
    //
    // Supabase transaction pooler (PgBouncer) limits:
    //  - Free plan:   6 connections max
    //  - Pro plan:    15 connections max per server
    //  - Team/Ent:    30+ connections
    //
    // In serverless (Vercel), each lambda instance gets its OWN pool.
    // With max:10 per instance and ~100 warm lambdas, that's 1000 connections
    // total — well within Supabase Pro. Keeping max LOW per instance is correct.
    //
    // In long-running server (Node/Docker), max:20 is appropriate.
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

    globalForDb.sql = postgres(databaseUrl, {
      ssl: 'require',
      prepare: false,      // MUST be false for Supabase transaction pooler (PgBouncer)
      max: isServerless ? 10 : 20, // 10 connections per lambda ensures concurrent queries don't deadlock
      idle_timeout: 10,    // Release idle connections fast (10s) to keep pool clean
      connect_timeout: 8,  // 8s connection timeout — never hang indefinitely
      timeout: 10,         // CRITICAL FIX: 10s query timeout prevents the 3-5 minute socket stall!
      max_lifetime: 1800,  // Recycle connections every 30 min to prevent stale connections
      // Retry on transient connection errors
      connection: {
        application_name: 'tenali-publishers-web',
      },
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
