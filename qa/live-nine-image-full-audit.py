import json, os, re, sys, time
from pathlib import Path
import requests

BASE="https://findit-nearby.vercel.app"
LAT=-25.7479
LON=28.2293
RADIUS=10

CASES=[
 {"key":"mercedes","file":"qa/fixtures/mercedes.jpg","must_any":["car","vehicle","suv","automotive"],"brand_any":["mercedes","benz"],"route_any":["autotrader","cars.co.za","webuycars","mercedes"]},
 {"key":"jbl","file":"qa/fixtures/jbl.jpg","must_any":["speaker","audio","electronics"],"brand_any":["jbl"],"route_any":["incredible","game","takealot","makro"]},
 {"key":"albany","file":"qa/fixtures/albany.jpg","must_any":["bread","grocery","food"],"brand_any":["albany"],"route_any":["checkers","pick n pay","shoprite","woolworths"]},
 {"key":"samba","file":"qa/fixtures/samba.jpg","must_any":["shoe","footwear","sneaker","trainer"],"brand_any":["adidas"],"route_any":["adidas","sportscene","totalsports"]},
 {"key":"wrench","file":"qa/fixtures/wrench.jpg","must_any":["wrench","spanner","tool","hardware"],"brand_any":[],"route_any":["builders","game","leroy"]},
 {"key":"smeg_toaster","file":"qa/fixtures/smeg_toaster.jpg","must_any":["toaster","appliance"],"brand_any":["smeg"],"route_any":["game","hifi","makro"]},
 {"key":"salt_pepper","file":"qa/fixtures/salt_pepper.jpg","must_any":["salt","pepper","shaker","kitchen","houseware"],"brand_any":[],"route_any":["game","woolworths","makro","checkers"]},
 {"key":"marc_anthony","file":"qa/fixtures/marc_anthony.jpg","must_any":["conditioner","hair","beauty","personal care"],"brand_any":["marc","anthony"],"route_any":["clicks","dis-chem","dis chem"]},
 {"key":"multiplug","file":"qa/fixtures/multiplug.jpg","must_any":["plug","adapter","adaptor","electrical","power strip","multi"],"brand_any":[],"route_any":["builders","game","leroy"]},
]
OUTSAMPLE=[
 {"key":"hammer","ident":{"name":"claw hammer","object":"hammer","category":"hardware","retailCategory":"hardware","searchQuery":"claw hammer"}},
 {"key":"frying_pan","ident":{"name":"non-stick frying pan","object":"frying pan","category":"kitchenware","retailCategory":"kitchenware","searchQuery":"non-stick frying pan"}},
 {"key":"extension_lead","ident":{"name":"extension lead","object":"extension lead","category":"electrical","retailCategory":"electrical","searchQuery":"extension lead"}},
 {"key":"vacuum","ident":{"name":"vacuum cleaner","object":"vacuum cleaner","category":"home appliances","retailCategory":"home appliances","searchQuery":"vacuum cleaner"}},
 {"key":"running_shoe","ident":{"name":"running shoe","object":"running shoe","category":"footwear","retailCategory":"footwear","searchQuery":"running shoe"}},
 {"key":"cereal","ident":{"name":"breakfast cereal","object":"cereal","category":"grocery","retailCategory":"grocery/household","searchQuery":"breakfast cereal"}},
 {"key":"headphones","ident":{"name":"wireless headphones","object":"headphones","category":"electronics","retailCategory":"electronics","searchQuery":"wireless headphones"}},
 {"key":"shampoo","ident":{"name":"shampoo","object":"shampoo","category":"hair care","retailCategory":"beauty","searchQuery":"shampoo"}},
 {"key":"toyota","ident":{"name":"Toyota Corolla","object":"car","brand":"Toyota","model":"Corolla","brandEvidence":True,"modelEvidence":True,"category":"vehicle","retailCategory":"vehicle","searchQuery":"Toyota Corolla"}},
]

session=requests.Session()
session.headers.update({"User-Agent":"FindIt-Nine-Image-QA/1.0"})
results={"base":BASE,"startedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"cases":[],"outOfSample":[]}
failures=[]

def norm(x):
    return re.sub(r"\s+"," ",str(x or "").lower()).strip()

def any_in(text, terms):
    t=norm(text)
    return any(norm(x) in t for x in terms)

def post_json(path, payload, timeout=65):
    t=time.monotonic()
    r=session.post(BASE+path,json=payload,timeout=timeout)
    elapsed=round(time.monotonic()-t,2)
    try: data=r.json()
    except Exception: data={"_raw":r.text[:1000]}
    return r.status_code,elapsed,data

def safe_offer_checks(key, data):
    errs=[]
    offers=data.get("offers") or []
    for i,o in enumerate(offers):
        if o.get("directionsAvailable") is True:
            errs.append(f"offer[{i}] online directionsAvailable=true")
        if o.get("branchStockVerified") is True and norm(o.get("stockScope"))=="online":
            errs.append(f"offer[{i}] online branchStockVerified=true")
        if o.get("price") is not None:
            trusted=bool(o.get("verified") or o.get("sourcePageVerified") or "feed" in norm(o.get("source")) or "catalog" in norm(o.get("source")))
            if not trusted:
                errs.append(f"offer[{i}] has price without a trusted verification marker")
    return errs

for case in CASES:
    row={"key":case["key"],"file":case["file"],"checks":[]}
    try:
        with open(case["file"],"rb") as f:
            t=time.monotonic()
            r=session.post(BASE+"/api/search",
                files={"image":(Path(case["file"]).name,f,"image/jpeg")},
                data={"lat":str(LAT),"lon":str(LON)},timeout=70)
            row["searchSeconds"]=round(time.monotonic()-t,2)
        row["searchStatus"]=r.status_code
        search=r.json()
        row["search"]=search
        ident=search.get("identification") or {}
        identity_text=" ".join(str(ident.get(k) or "") for k in ["object","name","brand","model","category","retailCategory","searchQuery","summary"])
        ok=r.status_code==200 and bool(ident)
        row["checks"].append({"name":"search_response","pass":ok})
        if not ok: failures.append(f"{case['key']}: /api/search failed HTTP {r.status_code}")
        type_ok=any_in(identity_text,case["must_any"])
        row["checks"].append({"name":"identity_family","pass":type_ok,"value":identity_text[:300]})
        if not type_ok: failures.append(f"{case['key']}: wrong/weak product family: {identity_text[:180]}")
        if case["brand_any"]:
            brand_ok=any_in(ident.get("brand",""),case["brand_any"]) or any_in(identity_text,case["brand_any"])
            row["checks"].append({"name":"brand","pass":brand_ok,"value":ident.get("brand")})
            if not brand_ok: failures.append(f"{case['key']}: expected brand evidence missing ({ident.get('brand')})")
        conf=float(ident.get("confidence") or 0)
        conf_ok=conf>=.55
        row["checks"].append({"name":"confidence_floor","pass":conf_ok,"value":conf})
        if not conf_ok: failures.append(f"{case['key']}: confidence below 0.55 ({conf})")
        if case["key"]=="wrench":
            suspect=bool(re.search(r"\b\d+(?:\.\d+)?\s*(?:mm|cm|inch|inches|in)\b",norm((ident.get("model") or "")+" "+(ident.get("searchQuery") or ""))))
            row["checks"].append({"name":"no_invented_tool_size","pass":not suspect})
            if suspect: failures.append("wrench: invented a size/dimension")
        q=ident.get("searchQuery") or ident.get("name") or ident.get("object")
        q_ok=bool(q and norm(q)!="product")
        row["checks"].append({"name":"useful_search_query","pass":q_ok,"value":q})
        if not q_ok: failures.append(f"{case['key']}: no useful search query")

        payload=dict(ident)
        payload["query"]=q
        payload["searchQuery"]=q
        st,secs,intel=post_json("/api/product-intelligence-v2",payload,timeout=75)
        row["intelStatus"]=st; row["intelSeconds"]=secs; row["intel"]=intel
        intel_ok=st==200
        row["checks"].append({"name":"retailer_api","pass":intel_ok})
        if not intel_ok: failures.append(f"{case['key']}: product intelligence HTTP {st}")
        route_text=json.dumps(intel,ensure_ascii=False)
        route_ok=any_in(route_text,case["route_any"])
        row["checks"].append({"name":"category_retailer_routing","pass":route_ok})
        if not route_ok: failures.append(f"{case['key']}: expected retailer family not surfaced")
        for e in safe_offer_checks(case["key"],intel):
            failures.append(f"{case['key']}: {e}")
            row["checks"].append({"name":"offer_safety","pass":False,"value":e})
        if not any(c["name"]=="offer_safety" for c in row["checks"]):
            row["checks"].append({"name":"offer_safety","pass":True})

        np={"lat":LAT,"lon":LON,"radiusKm":RADIUS,"mode":"likely","identification":ident}
        nst,nsecs,near=post_json("/api/nearby",np,timeout=45)
        row["nearbyLikelyStatus"]=nst; row["nearbyLikelySeconds"]=nsecs; row["nearbyLikely"]=near
        likely_safe=True
        for s in near.get("stores") or []:
            if s.get("exactProductMatch") is not False or s.get("stockVerified") is True or s.get("branchStockVerified") is True or s.get("directionsAvailable") is True:
                likely_safe=False
            if not isinstance(s.get("distanceKm"),(int,float)) or s.get("lat") is None or s.get("lon") is None:
                likely_safe=False
        row["checks"].append({"name":"nearby_likely_safety","pass":likely_safe,"stores":len(near.get("stores") or [])})
        if not likely_safe: failures.append(f"{case['key']}: likely nearby store overclaim or invalid geo data")

        ep={"lat":LAT,"lon":LON,"radiusKm":RADIUS,"identification":ident}
        est,esecs,exact=post_json("/api/nearby",ep,timeout=45)
        row["nearbyExactStatus"]=est; row["nearbyExactSeconds"]=esecs; row["nearbyExact"]=exact
        exact_safe=True
        for s in exact.get("stores") or []:
            if s.get("directionsAvailable") is True:
                if not (s.get("exactProductMatch") is True and s.get("branchStockVerified") is True and s.get("lat") is not None and s.get("lon") is not None):
                    exact_safe=False
            if s.get("price") is not None and s.get("branchPriceVerified") is not True:
                exact_safe=False
        row["checks"].append({"name":"directions_stock_price_gate","pass":exact_safe,"verifiedBranches":len(exact.get("stores") or [])})
        if not exact_safe: failures.append(f"{case['key']}: directions/branch stock/branch price gate broken")
    except Exception as e:
        row["exception"]=repr(e)
        failures.append(f"{case['key']}: exception {e!r}")
    results["cases"].append(row)

for case in OUTSAMPLE:
    row={"key":case["key"],"checks":[]}
    try:
        ident=case["ident"]
        st,secs,intel=post_json("/api/product-intelligence-v2",{**ident,"query":ident["searchQuery"]},timeout=65)
        row["intelStatus"]=st; row["intelSeconds"]=secs
        safe=not safe_offer_checks(case["key"],intel)
        row["checks"].append({"name":"retailer_api","pass":st==200})
        row["checks"].append({"name":"offer_safety","pass":safe})
        np={"lat":LAT,"lon":LON,"radiusKm":RADIUS,"mode":"likely","identification":ident}
        nst,nsecs,near=post_json("/api/nearby",np,timeout=40)
        row["nearbyStatus"]=nst; row["nearbySeconds"]=nsecs
        nsafe=all(s.get("directionsAvailable") is not True and s.get("stockVerified") is not True and s.get("exactProductMatch") is False for s in (near.get("stores") or []))
        row["checks"].append({"name":"nearby_fallback_safety","pass":nsafe,"stores":len(near.get("stores") or [])})
        if st!=200 or not safe or not nsafe:
            failures.append(f"out-of-sample {case['key']}: routing/safety failure")
    except Exception as e:
        row["exception"]=repr(e); failures.append(f"out-of-sample {case['key']}: {e!r}")
    results["outOfSample"].append(row)

results["finishedAt"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
results["failures"]=failures
results["passed"]=len(failures)==0
Path("qa-results").mkdir(exist_ok=True)
Path("qa-results/live-nine-image-full-audit.json").write_text(json.dumps(results,indent=2,ensure_ascii=False))

lines=["# FindIt live nine-image full audit","",f"Overall: **{'PASS' if not failures else 'FAIL'}**",f"Failures: **{len(failures)}**","",
"| Image | Identity | Brand | Retailer API | Routing | Nearby safety | Direction/stock/price gate | Search time |",
"|---|---|---|---|---|---|---|---:|"]
for r in results["cases"]:
    checks={c["name"]:c for c in r.get("checks",[])}
    def mark(k): return "✅" if checks.get(k,{}).get("pass") else "❌"
    brand="—" if "brand" not in checks else mark("brand")
    lines.append(f"| {r['key']} | {mark('identity_family')} | {brand} | {mark('retailer_api')} | {mark('category_retailer_routing')} | {mark('nearby_likely_safety')} | {mark('directions_stock_price_gate')} | {r.get('searchSeconds','—')}s |")
if failures:
    lines += ["","## Genuine failures"]+[f"- {x}" for x in failures]
lines += ["","## Notes",
"- Missing prices are **not** counted as a failure when no trustworthy retailer price is available.",
"- Nearby category retailers must never claim exact stock or unlock directions.",
"- Directions are allowed only for exact-product, branch-stock-verified results with coordinates.",
"- Out-of-sample tests cover hammer, frying pan, extension lead, vacuum, running shoe, cereal, headphones, shampoo, and Toyota Corolla."]
Path("qa-results/live-nine-image-full-audit.md").write_text("\n".join(lines))
print("\n".join(lines))
sys.exit(1 if failures else 0)
