const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
//const wss = new WebSocket.Server({ server });
const wss = new WebSocket.Server({ port: 8081 });

let clients = [];

wss.on('connection', (ws) => {
    clients.push(ws);

    ws.on('message', (message) => {
        console.log('Received:', message);

        for (let client of clients) {
            // No need to check if the client is the sender
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    });

    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
    });
});


server.listen(8080, () => {
    console.log('Server started on http://localhost:8080');
});
