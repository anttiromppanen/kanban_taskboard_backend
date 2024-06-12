import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/UserModel";

const loginRouter = express.Router();

loginRouter.post("/", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  const passwordCorrect =
    user && (await bcrypt.compare(password, user.password));

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  const { SECRET } = process.env;
  if (!SECRET) return res.status(404).json({ error: "Secret not set" });

  const token = jwt.sign(userForToken, process.env.SECRET || "");

  return res
    .status(200)
    .send({ token, username: user.username, role: user.role });
});

export default loginRouter;
