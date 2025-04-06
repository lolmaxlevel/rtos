const net = require('node:net');
const {WebSocketServer} = require('ws');
const ip = "192.168.31.222";
const client = net.createConnection({port: 7, host: ip}, () => {
    console.log('connected to server!');
    // setInterval(() => {
    //     client.write(new Uint8Array([1]));
    // }, 3000);
});
const buffer = [];
const bufferTask = data => buffer.push(data);

client.on('data', bufferTask);
client.on('data', data => {
    // console.log("Received", data.length);
})

const wss = new WebSocketServer({port: 8080});

wss.on('connection', function connection(ws) {
    console.log('client connected!');
    ws.on('error', console.error);

    ws.on('message', function message(data) {
        // console.log('received: %s', data);
        client.write(data);
    });

    const retranslate = (data) => {
        ws.send(data);
    }

    client.on('data', retranslate);
    client.removeListener('data', bufferTask);

    let data;
    while (data = buffer.shift()) {
        ws.send(data);
    }

    ws.on('data', data => {
        client.write(data);
    })

    ws.on('close', function close() {
        console.log('client disconnected!');
        client.removeListener('data', retranslate);
    });
});