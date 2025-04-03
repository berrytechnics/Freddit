import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { db } from '../db/connection';
import { User } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Define the JWT payload interface
interface TokenPayload extends JwtPayload {
  id: number;
  username: string;
}

export const authenticateToken = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Find user
    const user = await db('users').where({ id: decoded.id }).first();
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Error authenticating token:', error);
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Optional auth middleware - doesn't require authentication but attaches user if token is valid
export const optionalAuthenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Get user from database
    const user = await db('users').where({ id: decoded.id }).first();

    if (user) {
      // Attach user to request object
      req.user = {
        ...user,
        password_hash: undefined, // Don't expose password_hash to the client.
      };
    }

    next();
  } catch (error) {
    // Just continue without authentication if token is invalid
    next(error);
  }
};

// Admin middleware - requires user to be an admin
export const requireAdmin = (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
