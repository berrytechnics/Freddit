import bcrypt from 'bcryptjs';
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { db } from '../db/connection';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  AuthTokenResponse,
  User,
  UserLoginRequest,
  UserRegistrationRequest,
} from '../models/types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Validation middleware
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register new user
router.post(
  '/register',
  registerValidation,
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password }: UserRegistrationRequest = req.body;

      // Check if user exists
      const existingUser = await db('users')
        .where({ username })
        .orWhere({ email })
        .first();

      if (existingUser) {
        return res
          .status(400)
          .json({ message: 'Username or email already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user
      const [newUser] = await db<User>('users')
        .insert({
          username,
          email,
          password_hash,
          karma_post: 0,
          karma_comment: 0,
          is_admin: false,
        })
        .returning('*');

      // Generate token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response: AuthTokenResponse = {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          display_name: newUser.display_name,
          karma_post: newUser.karma_post,
          karma_comment: newUser.karma_comment,
          is_admin: newUser.is_admin,
        },
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login user
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password }: UserLoginRequest = req.body;

    // Check if user exists
    const user = await db<User>('users').where({ username }).first();

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response: AuthTokenResponse = {
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        karma_post: user.karma_post,
        karma_comment: user.karma_comment,
        is_admin: user.is_admin,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Cast the req to AuthenticatedRequest since we know authenticateToken middleware adds the user property
    const authenticatedReq = req;
    const user = authenticatedReq.user;

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const response: AuthTokenResponse = {
      token: req.headers.authorization?.split(' ')[1] || null,
      user,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
