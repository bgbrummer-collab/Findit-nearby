# FindIt Nearby — no-key Netlify mode

Netlify production does not require `GEMINI_API_KEY`.

- `/api/search` accepts uploaded images but does not guess an identity when no approved vision provider is configured.
- Typed product search, nearby discovery, maps, comparison, feedback and other non-vision features remain independent.
- Price and stock must remain evidence-backed; no fallback may fabricate either.
- The existing restricted-product rules in the legacy Gemini implementation remain in the repository and must be preserved if a future approved vision provider is connected.

This mode exists so hosting is not blocked by a third-party AI credential.
