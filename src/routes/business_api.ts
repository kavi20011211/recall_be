import express from "express";
import { createMerchant } from "../services/business_service";

const router = express.Router();

router.post("/create", createMerchant);

export default router;
