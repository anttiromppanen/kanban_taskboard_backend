import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import loginRoute from "./routes/loginRoute";
import userRoute from "./routes/userRoute";
import taskboardRoute from "./routes/taskboardRoute";
import { errorHandler, unknownEndpoint } from "./helpers/middleware";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api/login", loginRoute);
app.use("/api/user", userRoute);
app.use("/api/taskboard", taskboardRoute);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
