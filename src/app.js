import express from "express";
import cors from "cors";
import coockieParser from "cookie-parser";

const app = express();

app.use(cors());

//Common middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(coockieParser());

// Import routes
import healthcheckRouter from "./routes/healthcheck.route.js";
// Routes
app.use("/api/v1/healthcheck", healthcheckRouter);
export { app };
