export default async () => new Response(JSON.stringify({
  ok: true,
  app: 'FindIt Nearby',
  host: 'netlify',
  visionMode: 'no-key-safe-fallback'
}), {
  status: 200,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

export const config = { path: '/.netlify/functions/health' };
