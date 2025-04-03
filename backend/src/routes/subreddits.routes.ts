// backend/src/routes/subreddits.ts
import express, { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { db } from '../db/connection';
import { authenticateToken } from '../middleware/auth.middleware';
import { Subreddit, SubredditCreationRequest } from '../models/types';

const router = express.Router();

// Get all subreddits
router.get('/', async (req, res) => {
  try {
    const subreddits = await db('subreddits')
      .select('*')
      .orderBy('created_at', 'desc');

    res.json(subreddits);
  } catch (error) {
    console.error('Error fetching subreddits:', error);
    res.status(500).json({ error: 'Failed to fetch subreddits' });
  }
});

// Get subreddit by name
router.get(
  '/r/:name',
  param('name').isString().trim().notEmpty(),
  authenticateToken,
  async (req, res) => {
    try {
      const { name } = req.params;
      const subreddit = await db('subreddits').where({ name }).first();

      if (!subreddit) {
        return res.status(404).json({ error: 'Subreddit not found' });
      }

      // Get member count
      const [{ count: memberCount }] = await db('subreddit_members')
        .where('subreddit_id', subreddit.id)
        .count();

      // Check if requesting user is a member
      let isMember = false;
      let isModerator = false;

      if (req.user) {
        const membership = await db('subreddit_members')
          .where({
            subreddit_id: subreddit.id,
            user_id: req.user.id,
          })
          .first();

        isMember = !!membership;
        isModerator = membership ? membership.is_moderator : false;
      }

      res.json({
        ...subreddit,
        member_count: parseInt(memberCount as string),
        is_member: isMember,
        is_moderator: isModerator,
      });
    } catch (error) {
      console.error('Error fetching subreddit:', error);
      res.status(500).json({ error: 'Failed to fetch subreddit' });
    }
  }
);

// Create a new subreddit
router.post(
  '/',
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .matches(/^[a-zA-Z0-9_]{3,21}$/)
      .withMessage(
        'Subreddit name must be 3-21 characters and contain only letters, numbers, and underscores'
      ),
    body('display_name').isString().trim().optional(),
    body('description').isString().trim().optional(),
    body('is_private').isBoolean().optional(),
    body('is_restricted').isBoolean().optional(),
  ],
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const subredditData: SubredditCreationRequest = req.body;
      const userId = req.user!.id;

      // Check if subreddit name already exists
      const existingSubreddit = await db('subreddits')
        .where({ name: subredditData.name })
        .first();
      if (existingSubreddit) {
        return res.status(400).json({ error: 'Subreddit name already exists' });
      }

      // Create subreddit in a transaction
      const newSubreddit = await db.transaction<Subreddit>(async trx => {
        // Create the subreddit
        const [subredditId] = await trx('subreddits')
          .insert({
            name: subredditData.name,
            display_name: subredditData.display_name || subredditData.name,
            description: subredditData.description,
            is_private: subredditData.is_private || false,
            is_restricted: subredditData.is_restricted || false,
            creator_id: userId,
          })
          .returning('id');

        // Add creator as a member and moderator
        await trx('subreddit_members').insert({
          user_id: userId,
          subreddit_id: subredditId,
          is_moderator: true,
        });

        // Return the newly created subreddit
        return await trx('subreddits').where({ id: subredditId }).first();
      });

      res.status(201).json(newSubreddit);
    } catch (error) {
      console.error('Error creating subreddit:', error);
      res.status(500).json({ error: 'Failed to create subreddit' });
    }
  }
);

// Join a subreddit
router.post(
  '/:id/join',
  param('id').isInt().toInt(),
  authenticateToken,
  async (req, res) => {
    try {
      const subredditId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if subreddit exists
      const subreddit = await db('subreddits')
        .where({ id: subredditId })
        .first();
      if (!subreddit) {
        return res.status(404).json({ error: 'Subreddit not found' });
      }

      // Check if private (only for non-admin users)
      if (subreddit.is_private && !req.user!.is_admin) {
        return res.status(403).json({ error: 'This subreddit is private' });
      }

      // Check if already a member
      const existingMembership = await db('subreddit_members')
        .where({
          user_id: userId,
          subreddit_id: subredditId,
        })
        .first();

      if (existingMembership) {
        return res
          .status(400)
          .json({ error: 'Already a member of this subreddit' });
      }

      // Add as member
      await db('subreddit_members').insert({
        user_id: userId,
        subreddit_id: subredditId,
        is_moderator: false,
      });

      res.status(200).json({ message: 'Successfully joined subreddit' });
    } catch (error) {
      console.error('Error joining subreddit:', error);
      res.status(500).json({ error: 'Failed to join subreddit' });
    }
  }
);

// Leave a subreddit
router.post(
  '/:id/leave',
  param('id').isInt().toInt(),
  authenticateToken,
  async (req, res) => {
    try {
      const subredditId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if membership exists
      const membership = await db('subreddit_members')
        .where({
          user_id: userId,
          subreddit_id: subredditId,
        })
        .first();

      if (!membership) {
        return res
          .status(400)
          .json({ error: 'Not a member of this subreddit' });
      }

      // Cannot leave if you're the creator and the only moderator
      if (membership.is_moderator) {
        const subreddit = await db('subreddits')
          .where({ id: subredditId })
          .first();

        if (subreddit.creator_id === userId) {
          // Check if there are other moderators
          const moderatorCount = await db('subreddit_members')
            .where({
              subreddit_id: subredditId,
              is_moderator: true,
            })
            .whereNot('user_id', userId)
            .count()
            .first();

          if (parseInt(moderatorCount!.count as string) === 0) {
            return res.status(400).json({
              error:
                'Cannot leave subreddit. You are the only moderator. Appoint another moderator first or delete the subreddit.',
            });
          }
        }
      }

      // Remove membership
      await db('subreddit_members')
        .where({
          user_id: userId,
          subreddit_id: subredditId,
        })
        .delete();

      res.status(200).json({ message: 'Successfully left subreddit' });
    } catch (error) {
      console.error('Error leaving subreddit:', error);
      res.status(500).json({ error: 'Failed to leave subreddit' });
    }
  }
);

// Appoint a moderator
router.post(
  '/:id/moderators',
  [param('id').isInt().toInt(), body('user_id').isInt().toInt()],
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const subredditId = parseInt(req.params.id);
      const currentUserId = req.user!.id;
      const { user_id: targetUserId } = req.body;

      // Check if current user is a moderator
      const currentUserMembership = await db('subreddit_members')
        .where({
          user_id: currentUserId,
          subreddit_id: subredditId,
          is_moderator: true,
        })
        .first();

      if (!currentUserMembership) {
        return res
          .status(403)
          .json({ error: 'You must be a moderator to appoint moderators' });
      }

      // Check if target user is a member
      const targetUserMembership = await db('subreddit_members')
        .where({
          user_id: targetUserId,
          subreddit_id: subredditId,
        })
        .first();

      if (!targetUserMembership) {
        return res
          .status(404)
          .json({ error: 'User is not a member of this subreddit' });
      }

      // Update to moderator status
      await db('subreddit_members')
        .where({
          user_id: targetUserId,
          subreddit_id: subredditId,
        })
        .update({ is_moderator: true });

      res
        .status(200)
        .json({ message: 'User successfully appointed as moderator' });
    } catch (error) {
      console.error('Error appointing moderator:', error);
      res.status(500).json({ error: 'Failed to appoint moderator' });
    }
  }
);

// Get subreddit moderators
router.get(
  '/:id/moderators',
  param('id').isInt().toInt(),
  authenticateToken,
  async (req, res) => {
    try {
      const subredditId = parseInt(req.params.id);

      // Check if subreddit exists
      const subreddit = await db('subreddits')
        .where({ id: subredditId })
        .first();
      if (!subreddit) {
        return res.status(404).json({ error: 'Subreddit not found' });
      }

      // Get moderators
      const moderators = await db('subreddit_members')
        .join('users', 'subreddit_members.user_id', 'users.id')
        .where({
          'subreddit_members.subreddit_id': subredditId,
          'subreddit_members.is_moderator': true,
        })
        .select(
          'users.id',
          'users.username',
          'users.display_name',
          'users.avatar_url'
        );

      res.json(moderators);
    } catch (error) {
      console.error('Error fetching moderators:', error);
      res.status(500).json({ error: 'Failed to fetch moderators' });
    }
  }
);

export default router;
