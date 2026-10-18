"""Repeat the ten existing real query journeys; no mocked retailer responses."""
import concurrent.futures
import datetime
import json
import subprocess
from pathlib import Path

BASE = 'https://findit-nearby.bgbrummer.workers.dev'
ROOT = Path(__file__).resolve().parents[1]


def call(path, body=None):
    args = ['curl', '--max-time', '55', '-sS', '-w', '\n%{http_code}', BASE + path]
    if body is not None:
        args += ['-H', 'Content-Type: application/json', '--data-binary', json.dumps(body)]
    try:
        raw = subprocess.check_output(args, text=True)
        text, status = raw.rsplit('\n', 1)
        try:
            data = json.loads(text)
        except ValueError:
            data = {'error': 'Non-JSON response', 'raw': text[:500]}
        return {'status': int(status), 'data': data}
    except Exception as error:
        return {'error': str(error)}


def run(row):
    search = call('/api/search', {'query': row['query']})
    identity = search.get('data', {}).get('identification')
    commerce = call('/api/product-intelligence', {'identification': identity}) if identity else {}
    offers = commerce.get('data', {}).get('offers', [])
    research = call('/api/product-insights', {'identification': identity, 'offers': offers}) if identity else {}
    priced = [o for o in offers if o.get('verified') is True and o.get('exactProductMatch') is True
              and o.get('sourcePageVerified') is True and isinstance(o.get('price'), (int, float))
              and o['price'] > 0 and o.get('currency')]
    errors = [r for r in [search, commerce, research]
              if r.get('error') or r.get('status', 0) != 200 or r.get('data', {}).get('error')]
    status = 'failed: transport/reliability' if errors else 'passed' if priced else 'failed: no verified priced listing'
    result = {'category': row['category'], 'query': row['query'], 'status': status,
              'search': search, 'commerce': commerce, 'research': research}
    print(row['category'], status, flush=True)
    return result


if __name__ == '__main__':
    previous = json.loads((ROOT / 'launch-evidence-2026-10-17/verified-live-data-matrix.json').read_text())
    version = call('/api/version')
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(run, previous['results']))
    end_version = call('/api/version')
    output = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'base': BASE,
              'version': version, 'endVersion': end_version, 'versionStable': version == end_version,
              'results': results}
    Path(__file__).with_name('final-code-live-data-matrix.json').write_text(json.dumps(output, indent=2) + '\n')
