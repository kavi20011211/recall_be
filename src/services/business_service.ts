import { Request, Response } from "express";
import { db } from "../config/db_config";
import { generateToken } from "../config/jwt_token_config";

// Create Merchant
export const createMerchant = async (req: Request, res: Response) => {
  try {
    const { owner_phone, merchant_id, business_name } = req.body;

    if (!owner_phone || !merchant_id || !business_name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const query = `
      INSERT INTO merchants (owner_phone, merchant_id, business_name)
      VALUES (?, ?, ?)
    `;

    const [result]: any = await db.execute(query, [
      owner_phone,
      merchant_id,
      business_name,
    ]);

    const token = generateToken({
      id: merchant_id,
      owner_phone,
    });

    return res.status(201).json({
      success: true,
      message: "Merchant created successfully",
      merchantId: result.insertId,
      token: token,
    });
  } catch (error: any) {
    console.error("Create Merchant Error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      // Merchant already registered — return a fresh token so the device can re-authenticate
      try {
        const [rows]: any = await db.execute(
          `SELECT merchant_id, owner_phone FROM merchants WHERE merchant_id = ? LIMIT 1`,
          [req.body.merchant_id]
        );
        if (rows.length > 0) {
          const existing = rows[0];
          const token = generateToken({ id: existing.merchant_id, owner_phone: existing.owner_phone });
          return res.status(200).json({
            success: true,
            message: "Merchant already registered",
            token,
          });
        }
      } catch (_) {}
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
