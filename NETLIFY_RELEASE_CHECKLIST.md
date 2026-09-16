# Netlify release checklist

- [x] Static site publishes from repository root.
- [x] Netlify functions live under `netlify/functions`.
- [x] `/api/*` compatibility router is present.
- [x] Netlify `/api/search` no longer requires a Gemini credential.
- [x] No-key image mode refuses to fabricate identity, price or stock.
- [x] Health/status endpoints describe the active no-key mode.
- [ ] Exact photo recognition requires a future approved vision provider or an on-device model with adequate product accuracy.

Production should only be promoted after the branch deploy is green.
