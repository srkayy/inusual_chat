const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // Stub socket.io so the page loads without a real server
  if (req.url === '/socket.io/socket.io.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    res.end('// socket.io stub\nwindow.io = function(){ return { on(){}, emit(){}, connect(){} }; };');
    return;
  }

  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Inusualchat rodando em http://localhost:${PORT}\n`);
});
