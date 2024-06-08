import express from "express";
import jwt from "jsonwebtoken";
import Taskboard from "../models/TaskboardModel";
import { getTokenFrom } from "../helpers/helpers";
import { IToken } from "../types/types";

const router = express.Router();

router.get("/", async (_req, res) => {
  const result = await Taskboard.find({});
  return res.status(200).json(result);
});

router.post("/", async (_req, res) => {});

router.post("/task", async (req, res) => {
  const { title, description, status, taskboardId } = req.body;

  if (!taskboardId)
    return res.status(401).json({ error: "Taskboard id required" });

  const decodedToken = jwt.verify(
    getTokenFrom(req) || "",
    process.env.SECRET || "",
  );

  if (!(decodedToken as IToken).id) {
    return res.status(401).json({ error: "Invalid token" });
  }

  console.log(decodedToken);
  return res.status(404).json({ error: "Endpoint not finished" });
});

export default router;
