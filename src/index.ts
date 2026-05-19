import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";

import { db } from "./config/db_config";

import "./workers/sms_worker";
import "./workers/weekly_digest_worker";

import businessRouter from "./routes/business_api";
import customerRouter from "./routes/customer_api";
import visitRouter from "./routes/visit_api";
import smsWebhook from "./routes/sms_webhook";

import { startWeeklyDigestJob } from "./services/weekly_digest";
import { startReminderJob } from "./services/reminder_service";

dotenv.config();

startWeeklyDigestJob();
startReminderJob();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

db;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server running" });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK" });
});

app.use("/api/v1/business", businessRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/visit", visitRouter);
app.use("/api/v1/twilio/inbound-sms", smsWebhook);

// error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
});
