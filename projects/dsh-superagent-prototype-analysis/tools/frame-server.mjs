import http from 'node:http';
import fs from 'node:fs';
const dir = 'C:/Users/ruijh/AppData/Local/Temp/dsh-frames/';
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'POST' && req.url.startsWith('/frame/')) {
    const m = req.url.match(/(\d+)\.jpg/); const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => { if (m) fs.writeFileSync(dir + 'f' + m[1].padStart(5, '0') + '.jpg', Buffer.from(chunks.join(''), 'base64')); res.end('ok'); });
  } else { res.end('ok'); }
}).listen(8744, () => console.log('frame server on 8744'));
