from pathlib import Path
p=Path('api/search.js')
s=p.read_text()
# The previous 5 second limit was too aggressive for real mobile image uploads.
# Keep the anti-hang protection, but allow Gemini enough time to identify the image.
s=s.replace('const GEMINI_TIMEOUT_MS=5000;', 'const GEMINI_TIMEOUT_MS=12000;')
p.write_text(s)
