import { Request, Response } from "express";
import { db } from "../config/db_config";

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { merchant_id, phone_number, first_name, consent_timestamp } =
      req.body;

    if (!merchant_id || !phone_number || !consent_timestamp) {
      return res.status(400).json({
        success: false,
        message:
          "merchant_id, phone_number, and consent_timestamp are required",
      });
    }

    const checkQuery = `
      SELECT id, first_name, phone_number
      FROM customers
      WHERE merchant_id = ? AND phone_number = ?
      LIMIT 1
    `;

    const [existing]: any = await db.execute(checkQuery, [
      merchant_id,
      phone_number,
    ]);

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Customer already exists",
        customer: existing[0],
      });
    }

    const insertQuery = `
      INSERT INTO customers (
        merchant_id,
        phone_number,
        first_name,
        opt_out,
        consent_timestamp
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result]: any = await db.execute(insertQuery, [
      merchant_id,
      phone_number,
      first_name || null,
      false,
      consent_timestamp,
    ]);

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customerId: result.insertId,
    });
  } catch (error: any) {
    console.error("Create Customer Error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Customer already exists for this merchant",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
