import { Request, Response } from "express";
import { db } from "../config/db_config";

export const createVisit = async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      service_type,
      reminder_date,
      sms_sent,
      sms_sent_at,
      sms_failure_reason,
    } = req.body;

    if (!customer_id || !service_type || !reminder_date) {
      return res.status(400).json({
        success: false,
        message: "customer_id, service_type, and reminder_date are required",
      });
    }

    const allowedTypes = ["oil", "brakes", "tires", "general"];
    if (!allowedTypes.includes(service_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service_type",
      });
    }

    const query = `
      INSERT INTO visits (
        customer_id,
        service_type,
        reminder_date,
        sms_sent,
        sms_sent_at,
        sms_failure_reason
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result]: any = await db.execute(query, [
      customer_id,
      service_type,
      reminder_date,
      sms_sent ?? false,
      sms_sent_at ?? null,
      sms_failure_reason ?? null,
    ]);

    return res.status(201).json({
      success: true,
      message: "Visit created successfully",
      visitId: result.insertId,
    });
  } catch (error) {
    console.error("Create Visit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
