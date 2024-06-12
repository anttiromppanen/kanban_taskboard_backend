import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import bodyParser from "body-parser";
import http from "http";

const app = express();
app.use(bodyParser.json());
const port = 8080;

const onSocketPreError = (e: Error) =>
  console.log("Error upgrading request", e);

const onSocketPostError = (e: Error) => console.log("Socket post error", e);

const wss = new WebSocketServer({ noServer: true });

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  socket.on("error", onSocketPreError);

  wss.handleUpgrade(req, socket, head, (ws) => {
    socket.removeListener("error", onSocketPreError);
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws, _req) => {
  ws.on("error", onSocketPostError);

  ws.on("message", (msg, isBinary) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg, { binary: isBinary });
      }
    });
  });

  ws.on("close", () => console.log("Connection closed"));
});

app.post("/wss/notify", (req, res) => {
  const task = req.body;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(task));
    }
  });

  res.sendStatus(200);
});

const startWebSocketServer = () => {
  server.listen(port, () =>
    console.log(`WebSocket server running on port ${port}`),
  );
};

export default startWebSocketServer;
