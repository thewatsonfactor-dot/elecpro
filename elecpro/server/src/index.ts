import dotenv from "dotenv";
dotenv.config({ path: "../.env", override: true });

import express from "express";
import cors from "cors";
import path from "path";
import { analyzeRouter } from "./routes/analyze";
import { samRouter } from "./routes/sam";
import { authRouter } from "./routes/auth";
import { bidsRouter } from "./routes/bids";
import { takeoffRouter } from "./routes/takeoff";
import { intelRouter } from "./routes/intel";
import { authMiddleware } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.NODE_ENV === "production" ? false : "*" }));
app.use(express.json({ limit: "50mb" }));

// Public routes
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/analyze", authMiddleware, analyzeRouter);
app.use("/api/sam", authMiddleware, samRouter);
app.use("/api/bids", authMiddleware, bidsRouter);
app.use("/api/takeoff", authMiddleware, takeoffRouter);
app.use("/api/intel", authMiddleware, intelRouter);

// Serve client in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../client/dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`ElecPro server running on port ${PORT}`);
});
