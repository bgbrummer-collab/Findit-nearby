export default async () => new Response(JSON.stringify({
  imageSearch: 'safe-fallback',
  requiresGeminiKey: false,
  exactImageRecognition: false,
  typedSearchAvailable: true,
  note: 'FindIt will not guess product identity, price or stock without a configured vision provider.'
}), {
  status: 200,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

export const config = { path: '/api/search-mode' };
