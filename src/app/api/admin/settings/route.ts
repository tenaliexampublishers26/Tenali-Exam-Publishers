import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const settings = await sql`SELECT key, value FROM settings`;
    
    // Convert array of rows into a simple object
    const settingsMap = settings.reduce((acc, row) => {
      acc[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json({ success: true, settings: settingsMap }, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Support batch update if settings object is passed
    if (body.settings && typeof body.settings === 'object') {
      const entries = Object.entries(body.settings);
      for (const [key, value] of entries) {
        const stringValue = String(value);
        await sql`
          INSERT INTO settings (key, value) 
          VALUES (${key}, ${stringValue})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
        `;
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { key, value } = body;
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }
    
    const stringValue = String(value);

    await sql`
      INSERT INTO settings (key, value) 
      VALUES (${key}, ${stringValue})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
    `;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
