import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";
import startWebSocketServer from "./websocketServer";

dotenv.config();

const DB_URL = process.env.MONGODB_URL || "";

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

const connectDb = async () => {
  try {
    await mongoose.connect(DB_URL, { ...clientOptions, serverApi: "1" });
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Error connecting to MongoDB", err);
  }
};

const startServer = async () => {
  await connectDb();

  const server = http.createServer(app);
  const PORT = process.env.PORT || 3001;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startWebSocketServer();
  });
};

startServer().catch(console.dir);
