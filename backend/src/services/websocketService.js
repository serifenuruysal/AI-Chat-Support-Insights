const { WebSocketServer } = require('ws');
const { sendMessage } = require('../services/chatService');

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WS client connected');
    ws.isAlive = true;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (raw) => {
      let data;
      try { data = JSON.parse(raw); } catch { return ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' })); }

      if (data.type === 'message') {
        const { userId, content, conversationId } = data;
        if (!userId || !content) return ws.send(JSON.stringify({ type: 'error', error: 'userId and content required' }));

        // Send typing indicator
        ws.send(JSON.stringify({ type: 'typing', conversationId }));

        try {
          const result = await sendMessage({ userId, content, conversationId });
          ws.send(JSON.stringify({ type: 'reply', ...result }));
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', error: 'Failed to process message' }));
        }
      }
    });

    ws.on('close', () => console.log('WS client disconnected'));
    ws.on('error', console.error);
  });

  // Heartbeat
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  return wss;
}

module.exports = { setupWebSocket };
