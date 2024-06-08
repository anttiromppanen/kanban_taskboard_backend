import express from "express";
import bcrypt from "bcrypt";
import User from "../models/UserModel";

const router = express.Router();

router.get("/", async (_req, res) => {
  const response = await User.find({});
  return res.status(200).json(response);
});

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!(username.trim().length > 0 && password.trim().length > 0)) {
    return res.status(401).json({ error: "No empty values allowed" });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    password: passwordHash,
  });

  const savedUser = await user.save();

  return res.status(201).json(savedUser);
});

export default router;
