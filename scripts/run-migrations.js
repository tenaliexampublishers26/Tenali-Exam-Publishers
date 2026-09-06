const postgres = require('postgres');
const fs = require('fs');

const url = process.env.DATABASE_URL || 
  'postgresql://postgres.xsidvgynolsenmdnudqm:Tenali%402026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require';

const sql = postgres(url, { ssl: 'require', prepare: false, max: 2 });

async function run() {
  try {
    console.log('Running migration 1: add razorpay columns + idempotency_key...');
    const m1 = fs.readFileSync('./Supbase/migrate_add_razorpay_columns.sql', 'utf8');
    await sql.unsafe(m1);
    console.log('Migration 1 OK');

    console.log('Running migration 2: create payment_sessions table...');
    const m2 = fs.readFileSync('./Supbase/migrate_payment_sessions.sql', 'utf8');
    await sql.unsafe(m2);
    console.log('Migration 2 OK');

    console.log('\nVerifying columns on orders table:');
    const cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `;
    cols.forEach(c => console.log(' ', c.column_name, '-', c.data_type, c.is_nullable === 'YES' ? '(nullable)' : '(not null)'));

    console.log('\nVerifying payment_sessions table:');
    const sess = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payment_sessions'
      ORDER BY ordinal_position
    `;
    if (sess.length === 0) {
      console.log('  WARNING: payment_sessions table not found!');
    } else {
      sess.forEach(c => console.log(' ', c.column_name, '-', c.data_type, c.is_nullable === 'YES' ? '(nullable)' : '(not null)'));
    }

    // Verify the unique index on idempotency_key
    console.log('\nVerifying indexes on orders:');
    const idxs = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'orders' AND indexname LIKE '%idempotency%'
    `;
    if (idxs.length === 0) {
      console.log('  WARNING: no idempotency_key index found on orders');
    } else {
      idxs.forEach(i => console.log(' ', i.indexname));
    }

    console.log('\nAll migrations completed successfully!');
  } catch(e) {
    console.error('Migration error:', e.message);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
