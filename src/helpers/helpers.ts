import { Request } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { ITask, IToken } from "../types/types";

export const getTokenFrom = (req: Request) => {
  const authorization = req.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

export const decodedToken = (req: Request) => {
  const token = jwt.verify(getTokenFrom(req) || "", process.env.SECRET || "");
  return token as IToken;
};

export const notifyWebsocketServer = async (
  task: ITask,
  taskboardId: string,
) => {
  try {
    await axios.post("http://localhost:8080/wss/notify", { task, taskboardId });
  } catch (err) {
    return console.error("Error notifying websocket server", err);
  }

  return undefined;
};
