import { WebSocketServer, WebSocket } from "ws";
import express from "express";

const app = express();
const port = 8080;

const onSocketPreError = (e: Error) =>
  console.log("Error upgrading request", e);

const onSocketPostError = (e: Error) => console.log("Socket post error", e);

const expressServer = app.listen(port, () =>
  console.log(`Listening on port ${port}`),
);

const wss = new WebSocketServer({ noServer: true });

expressServer.on("upgrade", (req, socket, head) => {
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
