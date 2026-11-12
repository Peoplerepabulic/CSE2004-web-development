"""Local-only error-state preview. Never included in dist or deployed.
Run: python3 tests/preview.py --scenario recover --port 4174
Serves the real UI, but redirects its forecast URL to a local synthetic fixture.
recover: first request fails, Retry succeeds. storm: severe weather. denied: storage throws.
"""
import argparse, json, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
parser=argparse.ArgumentParser()
parser.add_argument('--scenario',choices=['recover','storm','denied','audit','reduced'],default='recover')
parser.add_argument('--port',type=int,default=4174)
parser.add_argument('--axe-js', default='/private/tmp/forest-a11y/node_modules/axe-core/axe.min.js')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]/'dist'
requests=0
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
 def send_content(self,content,mime,status=200):
  raw=content.encode();self.send_response(status);self.send_header('Content-Type',mime);self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
 def do_GET(self):
  global requests
  path=urlsplit(self.path).path
  if path=='/qa-axe.js':return self.send_content(Path(args.axe_js).read_text(),'text/javascript')
  if path=='/qa-audit.js':return self.send_content((root.parent/'tests/accessibility.js').read_text(),'text/javascript')
  if args.scenario=='reduced' and path.endswith('.css'):
   import re
   target=root/path.lstrip('/')
   if target.is_file():return self.send_content(re.sub(r'@media\s*\(prefers-reduced-motion:\s*reduce\)', '@media all',target.read_text()),'text/css')
  if path=='/forecast':
   requests+=1
   if args.scenario=='recover' and requests==1:return self.send_content('{"error":true}','application/json',503)
   start=int(time.time())//3600*3600
   hours=list(range(start,start+72*3600,3600))
   severe=args.scenario=='storm'
   hourly={'time':hours}
   for k,v in {'temperature_2m':65,'apparent_temperature':65,'precipitation_probability':95 if severe else 10,'weather_code':95 if severe else 1,'cloud_cover':90 if severe else 20,'wind_speed_10m':35 if severe else 5,'is_day':1}.items():hourly[k]=[v]*len(hours)
   return self.send_content(json.dumps({'hourly':hourly,'hourly_units':{'time':'unixtime','temperature_2m':'°F','wind_speed_10m':'mp/h'}}),'application/json')
  if path=='/planner-core.mjs' and args.scenario not in ['audit','reduced']:
   source=(root/'planner-core.mjs').read_text().replace('https://api.open-meteo.com/v1/forecast?','/forecast?')
   return self.send_content(source,'text/javascript')
  if path in ['/','/index.html']:
   source=(root/'index.html').read_text()
   if args.scenario in ['audit','reduced']:source=source.replace('</head>','<script src="/qa-axe.js" defer></script><script src="/qa-audit.js" defer></script></head>')
   if args.scenario=='reduced':
    import re
    source=re.sub(r'(href="[^"]+\.css)(?:\?[^"]*)?(")', r'\1?qa=reduced\2', source)
    source=source.replace('<head>','<head><script>const originalMatch=window.matchMedia.bind(window);window.matchMedia=q=>q.includes("prefers-reduced-motion")?{matches:true,media:q,addEventListener(){},removeEventListener(){}}:originalMatch(q);</script>')
   if args.scenario=='denied':source=source.replace('<head>','<head><script>Object.defineProperty(window,"localStorage",{get(){throw new DOMException("QA storage denial","SecurityError")}});</script>')
   source=source.replace('<body data-scene="morning">','<body data-scene="morning"><p style="position:fixed;bottom:0;left:0;z-index:10000;background:#fffdf5;color:#1e2b22;padding:8px">LOCAL QA · TEST SCENARIO · '+args.scenario+'</p>')
   return self.send_content(source,'text/html')
  super().do_GET()
ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
