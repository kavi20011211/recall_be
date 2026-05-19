import express from "express";
import { validateToken } from "../security/validateToken";
import { createCustomer } from "../services/customer_service";

const router = express.Router();

router.post("/create", validateToken, createCustomer);

export default router;
