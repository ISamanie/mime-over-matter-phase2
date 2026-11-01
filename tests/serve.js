// Optional localhost preview. Opening index.html directly still works.
// Only game scripts, index.html and the acceptance page are served.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
http.createServer((req,res)=>{
  let name;
  try {name=decodeURIComponent(req.url.split('?')[0]);} catch (_) {res.writeHead(400);res.end();return;}
  if(name==='/')name='/index.html';
  if(!/^\/(index\.html|tests\/preview\.html|js\/[a-z]+\.js)$/.test(name)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  const stream=fs.createReadStream(path.join(root,name));
  stream.on('error',()=>{res.writeHead(404);res.end();});stream.pipe(res);
}).listen(8765,'127.0.0.1',()=>console.log('Game: http://127.0.0.1:8765/index.html\nPlaytest: http://127.0.0.1:8765/tests/preview.html'));
