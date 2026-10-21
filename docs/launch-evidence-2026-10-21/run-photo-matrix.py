"""Real photo journeys, never substituting typed names for the uploaded image."""
import concurrent.futures, json, subprocess, datetime, mimetypes
from pathlib import Path
ROOT=Path(__file__).resolve().parent
BASE='https://findit-nearby.bgbrummer.workers.dev'
def call(path,body=None,photo=None):
 args=['curl','-sS','--max-time','55','-w','\n%{http_code}',BASE+path]
 if photo:args+=['-F','image=@'+photo+';type='+(mimetypes.guess_type(photo)[0] or 'image/jpeg')]
 if body is not None:args+=['-H','content-type: application/json','--data-binary',json.dumps(body)]
 try:
  raw=subprocess.check_output(args,text=True);text,status=raw.rsplit('\n',1)
  return {'status':int(status),'data':json.loads(text)}
 except Exception as e:return {'error':str(e)}
def run(row):
 photo=call('/api/search',photo=row['path']);identity=photo.get('data',{}).get('identification');commerce={};research={}
 if identity:
  commerce=call('/api/product-intelligence',{'identification':identity})
  research=call('/api/product-insights',{'identification':identity,'offers':commerce.get('data',{}).get('offers',[])})
 out={**{k:row[k] for k in ['category','path','page','imageUrl'] if k in row},'photo':photo,'commerce':commerce,'research':research}
 print(row['category'],photo.get('data',{}).get('code'),identity and identity.get('name'),flush=True)
 return out
if __name__=='__main__':
 rows=[r for r in json.load(open(ROOT/'photo-inputs.json')) if r.get('downloaded')]
 rows += [{'category':'attached-headset','path':'/workspace/scratch/e56c2af3a8d6/test-images/images (4)(3).jpg'}, {'category':'attached-cream','path':'/workspace/scratch/e56c2af3a8d6/test-images/WhatsApp Image 2026-08-09 at 17.56.07.jpeg'}]
 start=call('/api/version')
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(run,rows))
 end=call('/api/version')
 (ROOT/'production-photo-matrix.json').write_text(json.dumps({'startedVersion':start,'endVersion':end,'versionStable':start==end,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':results},indent=2))
