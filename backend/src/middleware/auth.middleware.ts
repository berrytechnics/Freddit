import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/connection";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

interface JwtPayload {
  id: number;
  username: string;
}

// Middleware to verify JWT token
export const authenticateToken = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Get user from database
    const user = await db("users").where({ id: decoded.id }).first();

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Optional auth middleware - doesn't require authentication but attaches user if token is valid
export const optionalAuthenticateToken = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Get user from database
    const user = await db("users").where({ id: decoded.id }).first();

    if (user) {
      // Attach user to request object
      req.user = {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
      };
    }

    next();
  } catch (error) {
    // Just continue without authentication if token is invalid
    next();
  }
};

// Admin middleware - requires user to be an admin
export const requireAdmin = (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
