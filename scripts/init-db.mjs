import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL not found in .env.local or environment');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

async function initDatabase() {
  console.log('🔄 Connecting to Supabase Database...');
  
  try {
    // Test basic query
    const versionResult = await sql`SELECT version()`;
    console.log('✅ Connected successfully to Supabase PostgreSQL!');
    console.log('🐘 PostgreSQL Version:', versionResult[0].version);

    // Create Users Table
    console.log('📦 Creating tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name character varying NOT NULL,
        email character varying UNIQUE,
        phone character varying,
        role character varying DEFAULT 'customer',
        image TEXT,
        password_hash character varying,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Addresses Table
    await sql`
      CREATE TABLE IF NOT EXISTS addresses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        full_name character varying NOT NULL,
        mobile character varying NOT NULL,
        email character varying NOT NULL,
        house_flat character varying NOT NULL,
        street character varying NOT NULL,
        area character varying,
        city character varying NOT NULL,
        state character varying NOT NULL,
        pin_code character varying NOT NULL,
        is_default boolean DEFAULT FALSE,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Products Table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id character varying PRIMARY KEY,
        slug character varying UNIQUE NOT NULL,
        name character varying NOT NULL,
        bundle_title character varying,
        books_included integer DEFAULT 1,
        edition character varying,
        short_description text,
        description text NOT NULL,
        price numeric NOT NULL,
        image character varying NOT NULL,
        images jsonb,
        category character varying NOT NULL,
        exam_coverage character varying,
        badges jsonb,
        features jsonb,
        table_of_contents jsonb,
        brand character varying,
        badge character varying,
        stock integer DEFAULT 0,
        languages jsonb,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Orders Table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number character varying UNIQUE NOT NULL,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        subtotal numeric NOT NULL,
        delivery_charge numeric NOT NULL,
        total numeric NOT NULL,
        delivery_address jsonb NOT NULL,
        status character varying DEFAULT 'placed',
        payment_status character varying DEFAULT 'pending',
        tracking_number character varying,
        carrier character varying,
        dispatched_at timestamp with time zone,
        notes text,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Order Items Table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
        product_id character varying,
        product_name character varying NOT NULL,
        product_slug character varying NOT NULL,
        product_image character varying NOT NULL,
        price numeric NOT NULL,
        language character varying NOT NULL,
        quantity integer NOT NULL DEFAULT 1,
        bundle_title character varying,
        books_included integer
      )
    `;

    // Create Wishlist Items Table
    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        product_id character varying REFERENCES products(id) ON DELETE CASCADE,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, product_id)
      )
    `;

    // Seed Products if table is empty
    const existingProducts = await sql`SELECT count(*) FROM products`;
    if (parseInt(existingProducts[0].count) === 0) {
      console.log('🌱 Seeding initial products...');
      await sql`
        INSERT INTO products (
          id, slug, name, bundle_title, books_included, edition, short_description, description,
          price, languages, image, images, category, exam_coverage, features, badge, stock
        ) VALUES (
          'p1',
          'mts-postman-mg',
          'MTS + POSTMAN / MG',
          '2-Book Preparation Set',
          2,
          'First Edition',
          'Comprehensive 2-book preparation bundle covering MTS, Postman, and Mail Guard syllabi. Updated with latest department rules.',
          'Prepare for MTS, Postman, and Mail Guard (MG) examinations with this complete 2-book preparation set. This bundle combines essential exam-focused study material covering the key subjects, concepts, rules, and postal-related topics required for your preparation.',
          800,
          '[{"code":"en","name":"English"},{"code":"te","name":"Telugu"},{"code":"hi","name":"Hindi"}]'::jsonb,
          '/images/book-mts-postman.jpg',
          '["/images/book-mts-postman.jpg", "/images/common-guide-2027.jpg"]'::jsonb,
          'Combo Pack',
          'MTS, Postman & Mail Guard (MG) Examinations',
          '["Exam-focused coverage for MTS, Postman & Mail Guard (MG)", "Coverage of relevant postal subjects, rules, and concepts", "Concept-based notes, tables, and important rules", "Useful study material for revision and exam preparation"]'::jsonb,
          'Best Seller',
          100
        ),
        (
          'p2',
          'pa-sa',
          'PA / SA (LGO)',
          'PA/SA (LGO) Guide Set',
          3,
          'First Edition',
          'Complete 3-book preparation bundle for PA / SA examination.',
          'Prepare for the Postal Assistant (PA) and Sorting Assistant (SA) examinations with this complete 3-book preparation set. The bundle brings together essential study material covering the subjects and concepts required for your exam preparation, presented in a simple and easy-to-understand format.',
          1200,
          '[{"code":"en","name":"English"},{"code":"te","name":"Telugu"},{"code":"hi","name":"Hindi"}]'::jsonb,
          '/images/book-pa-sa.jpg',
          '["/images/book-pa-sa.jpg"]'::jsonb,
          'Study Guide',
          'Postal Assistant (PA) & Sorting Assistant (SA) Examinations',
          '["PA / SA exam-focused study material", "Coverage of relevant postal subjects, manuals, and concepts", "Topic-wise practice questions and MCQs", "Concept-based explanations for easier preparation", "Useful revision material for exam preparation"]'::jsonb,
          NULL,
          100
        )
      `;
      console.log('✅ Seeded 2 product bundles.');
    }

    console.log('🎉 Supabase database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
}

initDatabase();
