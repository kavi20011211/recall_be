import express from "express";
import { validateToken } from "../security/validateToken";
import { createVisit } from "../services/visit_service";

const router = express.Router();
router.post("/create", validateToken, createVisit);
export default router;
