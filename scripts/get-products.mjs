import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
  const products = await sql`SELECT id, name, slug, price, languages, bundle_title, books_included, image FROM products`;
  console.log('Products:', JSON.stringify(products, null, 2));

  // Check if Vitapu Rajasekhar reddy has an address or user record or anything in user_addresses or addresses
  const user = await sql`SELECT * FROM users WHERE email = 'v.r.s.reddy1985@gmail.com'`;
  console.log('User:', JSON.stringify(user, null, 2));

  try {
    const userAddresses = await sql`SELECT * FROM user_addresses WHERE user_id = ${user[0]?.id}`;
    console.log('user_addresses:', JSON.stringify(userAddresses, null, 2));
  } catch (e) {
    console.log('user_addresses table error:', e.message);
  }

  try {
    const addresses = await sql`SELECT * FROM addresses WHERE user_id = ${user[0]?.id}`;
    console.log('addresses:', JSON.stringify(addresses, null, 2));
  } catch (e) {
    console.log('addresses table error:', e.message);
  }

  await sql.end();
}
run();
