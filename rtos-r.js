const {WebSocketServer} = require('ws');

const wss = new WebSocketServer({port: 8080});

wss.on('connection', function connection(ws) {
    console.log('client connected!');
    ws.on('error', console.error);

    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });

  let tickCount = 0; // Initialize tick count
  const PAYLOAD_SIZE = 5; // 4 bytes for tickCount + 1 byte for id
  const MAX_IDS = 20; // Number of random IDs to send

  const timer = setInterval(() => {
    let buffer = new Uint8Array(PAYLOAD_SIZE * MAX_IDS);
    for (let i = 0; i < MAX_IDS; i++) {
      const id = Math.floor(Math.random() * 50) + 1;

      // Write tickCount into the buffer
      buffer[i * PAYLOAD_SIZE] = (tickCount >> 24) & 0xFF; // Most significant byte
      buffer[i * PAYLOAD_SIZE + 1] = (tickCount >> 16) & 0xFF;
      buffer[i * PAYLOAD_SIZE + 2] = (tickCount >> 8) & 0xFF;
      buffer[i * PAYLOAD_SIZE + 3] = tickCount & 0xFF;

      // Write id into the buffer
      buffer[i * PAYLOAD_SIZE + 4] = id;
    }

    // Send the buffer as a Blob or ArrayBuffer
    ws.send(buffer.buffer);

    tickCount++; // Increment tick count
  }, 20); // Send every second

    ws.on('close', function close() {
        clearInterval(timer);
    });
});