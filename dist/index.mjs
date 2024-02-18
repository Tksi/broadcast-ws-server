#!/usr/bin/env node
import http from 'node:http';
import { WebSocketServer } from 'ws';
const roomMap = new Map();
const httpServer = http.createServer((req, res) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    const { pathname } = new URL(req.url ?? '', `http://${req.headers.host}`);
    const roomId = pathname.split('/')[1];
    if (roomId === undefined || roomId.length === 0) {
        res.writeHead(404, headers);
        res.end('');
    }
    else {
        switch (req.method) {
            case 'OPTIONS': {
                res.writeHead(200, headers);
                res.end();
                break;
            }
            case 'GET': {
                res.writeHead(200, { 'Content-Type': 'application/json', ...headers });
                res.end(JSON.stringify({ online: roomMap.get(roomId)?.size ?? 0 }));
                break;
            }
            case 'POST': {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        for (const ws of roomMap.get(roomId) ?? []) {
                            ws.send(body);
                        }
                        res.writeHead(200, headers);
                        res.end('');
                    }
                    catch (err) {
                        console.error(err);
                        res.writeHead(500, headers);
                        res.end(err instanceof Error ? err.message : '');
                    }
                });
                break;
            }
            default: {
                res.writeHead(404, headers);
                res.end('');
                break;
            }
        }
    }
});
const wss = new WebSocketServer({ server: httpServer });
wss.on('connection', function connection(ws, req) {
    const { pathname } = new URL(req.url ?? '', `ws://${req.headers.host}`);
    const roomId = pathname.split('/')[1];
    if (roomId === undefined || roomId.length === 0) {
        return ws.close(1001, 'Set roomId');
    }
    if (roomMap.has(roomId)) {
        roomMap.get(roomId)?.add(ws);
    }
    else {
        roomMap.set(roomId, new Set([ws]));
    }
    ws.on('message', () => {
        ws.send('pong');
    });
    ws.on('close', () => {
        roomMap.get(roomId)?.delete(ws);
        if (roomMap.get(roomId)?.size === 0) {
            roomMap.delete(roomId);
        }
    });
    ws.on('error', console.error);
});
const PORT = process.env.PORT ?? 4567;
httpServer.listen(PORT, () => {
    console.info(`🚀 http://localhost:${PORT}/`);
    console.info(`🚀 ws://localhost:${PORT}/`);
});
