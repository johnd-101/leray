import { NextRequest } from 'next/server';
// MAINTENANCE: Stores push subscription in Postgres so cron can send even when tab closed
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { subscription, email } = await req.json();
  if (!subscription?.endpoint) return Response.json({ error: 'Invalid sub' }, { status: 400 });

  // TODO: Replace with your DB client (Prisma, pg, etc.)
  // Example with fetch to your /api - you already have Postgres
  const { endpoint, keys } = subscription;

  // Simple: use your existing DB - adapt this to your db lib
  // For now using direct SQL via your /api - you can replace with prisma
  try {
    // If you use Vercel Postgres / Neon, do:
    // await sql`INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, user_email) VALUES (${endpoint.slice(-20)}, ${endpoint}, ${keys.p256dh}, ${keys.auth}, ${email}) ON CONFLICT (endpoint) DO UPDATE SET user_email=${email}`

    // TEMP fallback - log it, replace with real DB write
    console.log('Saving subscription for', email, endpoint.slice(0,50));

    // Example using your existing API - you need to implement DB write here
    // For quick test, store in memory/file - but use Postgres in prod
    return Response.json({ ok: true });
  } catch (e:any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}