#!/usr/bin/env node
/**
 * OpenClaw Virtual Office — WebSocket Server
 * 
 * Serves the dashboard + pushes real-time status updates via WebSocket.
 * Polls OpenClaw sessions every 10s and broadcasts changes to all clients.
 * 
 * Usage:
 *   node server.js                    # Default port 18899
 *   PORT=8080 node server.js          # Custom port
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = parseInt(process.env.PORT || '18899');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '10000'); // 10s
const BASE_DIR = __dirname;

// --- Simple WebSocket implementation (no dependencies) ---

function hashWebSocketKey(key) {
  const crypto = require('crypto');
  return crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-A5AB53DC65B4')
    .digest('base64');
}

function encodeFrame(data) {
  const payload = Buffer.from(data, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // text frame, fin
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function decodeFrame(buffer) {
  if (buffer.length < 2) return null;
  const masked = (buffer[1] & 0x80) !== 0;
  let payloadLen = buffer[1] & 0x7f;
  let offset = 2;
  if (payloadLen === 126) {
    payloadLen = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    payloadLen = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }
  if (masked) {
    const mask = buffer.slice(offset, offset + 4);
    offset += 4;
    const data = buffer.slice(offset, offset + payloadLen);
    for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
    return data.toString('utf8');
  }
  return buffer.slice(offset, offset + payloadLen).toString('utf8');
}

// --- State management ---

const clients = new Set();
let currentStatus = null;
let config = {};

function loadConfig() {
  try {
    config = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'config.json'), 'utf8'));
  } catch (e) {
    config = { title: 'OpenClaw Virtual Office', agents: [] };
  }
}

function getSessions() {
  try {
    const out = execSync('openclaw sessions list --json', {
      timeout: 10000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const data = JSON.parse(out);
    return Array.isArray(data) ? data : (data.sessions || []);
  } catch (e) {
    return [];
  }
}

function matchSession(agent, sessions) {
  const pattern = agent.sessionMatch || '';
  if (!pattern) return null;
  return sessions.find(s => {
    const hay = (s.key || '') + '|' + (s.displayName || '');
    return hay.includes(pattern);
  });
}

function buildStatus() {
  const sessions = getSessions();
  const now = Date.now();
  const agents = (config.agents || []).map(agent => {
    const s = matchSession(agent, sessions);
    if (s) {
      const age = s.updatedAt ? Math.floor((now - s.updatedAt) / 60000) : 999;
      let status = 'offline';
      if (age < 2) status = 'busy';
      else if (age < 10) status = 'online';
      else if (age < 60) status = 'idle';

      // Extract last message
      let task = '...';
      for (const msg of [...(s.messages || [])].reverse()) {
        const content = msg.content;
        if (Array.isArray(content)) {
          for (const c of content) {
            if (c && c.type === 'text' && c.text && c.text.trim().length > 2) {
              task = c.text.trim().slice(0, 80);
              break;
            }
          }
        } else if (typeof content === 'string' && content.trim().length > 2) {
          task = content.trim().slice(0, 80);
        }
        if (task !== '...') break;
      }

      return {
        id: agent.id, name: agent.name, sprite: agent.sprite || 'desk-with-pc.png',
        role: agent.role || '', status, task, lastActive: age,
        session: s.key, tokens: s.totalTokens || 0,
      };
    }
    return {
      id: agent.id, name: agent.name, sprite: agent.sprite || 'desk-with-pc.png',
      role: agent.role || '', status: 'offline', task: '尚未建立 session',
      lastActive: -1, session: null, tokens: 0,
    };
  });

  return { title: config.title || 'OpenClaw Virtual Office', timestamp: now, agents };
}

function broadcast(data) {
  const frame = encodeFrame(JSON.stringify(data));
  for (const client of clients) {
    try { client.write(frame); } catch (e) { clients.delete(client); }
  }
}

// --- HTTP server ---

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath = req.url.split('?')[0];
  if (filePath === '/') filePath = '/index.html';
  
  // API endpoint for current status
  if (filePath === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(currentStatus || { agents: [] }));
    return;
  }

  const fullPath = path.join(BASE_DIR, filePath);
  // Security: prevent path traversal
  if (!fullPath.startsWith(BASE_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// --- WebSocket upgrade ---

server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/ws') { socket.destroy(); return; }
  
  const key = req.headers['sec-websocket-key'];
  const accept = hashWebSocketKey(key);
  
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n` +
    '\r\n'
  );
  
  clients.add(socket);
  console.log(`[WS] Client connected (${clients.size} total)`);
  
  // Send current status immediately
  if (currentStatus) {
    socket.write(encodeFrame(JSON.stringify(currentStatus)));
  }
  
  socket.on('data', (buf) => {
    const opcode = buf[0] & 0x0f;
    if (opcode === 0x8) { // close
      clients.delete(socket);
      socket.end();
    }
    // ping → pong
    if (opcode === 0x9) {
      const pong = Buffer.from(buf);
      pong[0] = (pong[0] & 0xf0) | 0xa;
      socket.write(pong);
    }
  });
  
  socket.on('close', () => {
    clients.delete(socket);
    console.log(`[WS] Client disconnected (${clients.size} total)`);
  });
  
  socket.on('error', () => { clients.delete(socket); });
});

// --- Main loop ---

loadConfig();
// Watch config changes
fs.watchFile(path.join(BASE_DIR, 'config.json'), () => {
  console.log('[Config] Reloaded');
  loadConfig();
});

function poll() {
  const newStatus = buildStatus();
  const changed = JSON.stringify(newStatus.agents) !== JSON.stringify((currentStatus || {}).agents);
  currentStatus = newStatus;
  
  // Also write status.json for backward compatibility
  fs.writeFileSync(path.join(BASE_DIR, 'status.json'), JSON.stringify(newStatus, null, 2));
  
  if (changed && clients.size > 0) {
    console.log(`[Poll] Status changed, broadcasting to ${clients.size} clients`);
    broadcast(newStatus);
  }
}

poll(); // Initial
setInterval(poll, POLL_INTERVAL);

server.listen(PORT, '0.0.0.0', () => {
  const online = (currentStatus?.agents || []).filter(a => a.status !== 'offline').length;
  const total = (currentStatus?.agents || []).length;
  console.log(`\n🏢 OpenClaw Virtual Office Server`);
  console.log(`   http://0.0.0.0:${PORT}`);
  console.log(`   WebSocket: ws://0.0.0.0:${PORT}/ws`);
  console.log(`   Agents: ${online}/${total} online`);
  console.log(`   Polling every ${POLL_INTERVAL / 1000}s\n`);
});
