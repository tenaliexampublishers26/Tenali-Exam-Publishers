export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`SELECT value FROM settings WHERE key = 'maintenance_mode'`;
    const isMaintenance = result.length > 0 && result[0].value === 'true';
    
    const response = NextResponse.json(
      { maintenanceMode: isMaintenance },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
    response.cookies.set('tep_maintenance', isMaintenance ? 'true' : 'false', {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    return response;
  } catch (error) {
    // Fail open - if DB is down, assume no maintenance mode so site works if possible
    console.error('Error checking maintenance mode:', error);
    return NextResponse.json({ maintenanceMode: false }, { status: 200 });
  }
}
