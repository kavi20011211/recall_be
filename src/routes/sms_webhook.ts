import express from "express";
import { db } from "../config/db_config";

const router = express.Router();

router.post("/twilio/inbound-sms", async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body;

  const normalized = body?.trim().toLowerCase();

  if (normalized === "stop") {
    await db.execute(
      `
      UPDATE visits
      SET sms_opt_out = TRUE,
          sms_opt_out_at = NOW()
      WHERE phone_number = ?
      `,
      [from],
    );

    console.log(`User opted out: ${from}`);
  }

  res.set("Content-Type", "text/xml");
  res.send("<Response></Response>");
});

export default router;
