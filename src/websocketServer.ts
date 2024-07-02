import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import bodyParser from "body-parser";
import http from "http";

interface ChatClient {
  ws: WebSocket;
  userId: string;
}

const app = express();
app.use(bodyParser.json());
const port = 8080;

const onSocketPreError = (e: Error) =>
  console.log("Error upgrading request", e);

const onSocketPostError = (e: Error) => console.log("Socket post error", e);

const wss = new WebSocketServer({ noServer: true });
const chatrooms = new Map<string, Set<ChatClient>>();

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

  let chatroomId: string;
  let userId: string;

  ws.on("message", (msg, isBinary) => {
    const parsedMsg = JSON.parse(msg.toString());

    if (parsedMsg.type === "join") {
      chatroomId = parsedMsg.chatroomId;
      userId = parsedMsg.userId;

      // type is required
      if (!parsedMsg.type) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "type is required",
          }),
        );
        return;
      }

      // chatroomId is required
      if (!chatroomId) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "chatroomId is required",
          }),
        );
        return;
      }

      // userId is required
      if (!userId) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "userId is required",
          }),
        );
        return;
      }

      if (!chatrooms.has(chatroomId)) {
        chatrooms.set(chatroomId, new Set());
      }

      const chatroom = chatrooms.get(chatroomId);

      if (chatroom) {
        chatroom.add({ ws, userId });
        ws.send(
          JSON.stringify({
            type: "info",
            message: `Joined chatroom ${chatroomId}`,
          }),
        );
      }
    } else if (parsedMsg.type === "message") {
      const clients = chatrooms.get(chatroomId);
      if (clients) {
        clients.forEach((client) => {
          if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
              JSON.stringify({
                type: "message",
                message: parsedMsg.message,
                user: userId,
              }),
              { binary: isBinary },
            );
          }
        });
      }
    }
  });

  ws.on("close", () => {
    if (chatroomId) {
      const clients = chatrooms.get(chatroomId);
      if (clients) {
        clients.forEach((client) => {
          if (client.ws === ws) {
            clients.delete(client);
          }
        });

        if (clients.size === 0) {
          chatrooms.delete(chatroomId);
        }
      }
    }

    console.log(`User ${userId} disconnected from chatroom ${chatroomId}`);
    console.log(chatrooms);
  });
});

app.post("/wss/notify", (req, res) => {
  const { chatroomId, task } = req.body;
  const clients = chatrooms.get(chatroomId);

  if (clients) {
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(task));
      }
    });
  }

  res.sendStatus(200);
});

const startWebSocketServer = () => {
  server.listen(port, () =>
    console.log(`WebSocket server running on port ${port}`),
  );
};

export default startWebSocketServer;
