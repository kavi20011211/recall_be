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
  } catch (error) {
    console.error("Create Merchant Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
