import express from "express";
import cors from "cors";
import coockieParser from "cookie-parser";
import path from "path";

const app = express();
const __dirname = path.resolve();
app.use(cors());

//Common middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(coockieParser());
app.use("/temp", express.static(path.join(__dirname, "/public/temp")));
// Import routes
import healthcheckRouter from "./routes/healthcheck.route.js";
import userRouter from "./routes/user.routes.js";
import uploadRouter from "./routes/upload.route.js";
// Routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/userAuth", userRouter);
app.use("/api/v1/upload", uploadRouter);
export { app };
