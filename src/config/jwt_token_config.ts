import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const generateToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET);
};
