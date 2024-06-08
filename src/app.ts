import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import loginRoute from "./routes/loginRoute";
import userRoute from "./routes/userRoute";
import taskboardRoute from "./routes/taskboardRoute";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api/login", loginRoute);
app.use("/api/user", userRoute);
app.use("/api/taskboard", taskboardRoute);

export default app;
