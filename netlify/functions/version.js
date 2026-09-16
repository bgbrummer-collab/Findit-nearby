export default async () => new Response(JSON.stringify({ release: 'netlify-no-key-2026-09-16' }), {
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
export const config = { path: '/api/version' };
