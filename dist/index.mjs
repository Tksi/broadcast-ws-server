#!/usr/bin/env node
var _a;
import http from 'node:http';
import { WebSocketServer } from 'ws';
const roomMap = new Map();
const httpServer = http.createServer((req, res) => {
    var _a, _b, _c;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    const { pathname } = new URL((_a = req.url) !== null && _a !== void 0 ? _a : '', `http://${req.headers.host}`);
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
                res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, headers));
                res.end(JSON.stringify({ online: (_c = (_b = roomMap.get(roomId)) === null || _b === void 0 ? void 0 : _b.size) !== null && _c !== void 0 ? _c : 0 }));
                break;
            }
            case 'POST': {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    var _a;
                    try {
                        for (const ws of (_a = roomMap.get(roomId)) !== null && _a !== void 0 ? _a : []) {
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
    var _a, _b;
    const { pathname } = new URL((_a = req.url) !== null && _a !== void 0 ? _a : '', `ws://${req.headers.host}`);
    const roomId = pathname.split('/')[1];
    if (roomId === undefined || roomId.length === 0) {
        return ws.close(1001, 'Set roomId');
    }
    if (roomMap.has(roomId)) {
        (_b = roomMap.get(roomId)) === null || _b === void 0 ? void 0 : _b.add(ws);
    }
    else {
        roomMap.set(roomId, new Set([ws]));
    }
    ws.on('close', () => {
        var _a, _b;
        (_a = roomMap.get(roomId)) === null || _a === void 0 ? void 0 : _a.delete(ws);
        if (((_b = roomMap.get(roomId)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
            roomMap.delete(roomId);
        }
    });
    ws.on('error', console.error);
});
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 4567;
httpServer.listen(PORT, () => {
    console.info(`🚀 http://localhost:${PORT}/`);
    console.info(`🚀 ws://localhost:${PORT}/`);
});
