// backend/src/routes/posts.ts
import express, { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { db } from '../db/connection';
import { authenticateToken } from '../middleware/auth.middleware';
import { Post, PostCreationRequest, VoteRequest } from '../models/types';

const router = express.Router();

// Get all posts with pagination and sorting
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sort').optional().isIn(['new', 'top', 'hot']),
  ],
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sort = (req.query.sort as string) || 'hot';
      const offset = (page - 1) * limit;

      let postsQuery = db('posts')
        .join('users', 'posts.user_id', 'users.id')
        .join('subreddits', 'posts.subreddit_id', 'subreddits.id')
        .select(
          'posts.*',
          'users.username as author',
          'users.avatar_url as author_avatar',
          'subreddits.name as subreddit_name'
        )
        .where('posts.is_removed', false);

      // Apply sorting
      switch (sort) {
        case 'new':
          postsQuery = postsQuery.orderBy('posts.created_at', 'desc');
          break;
        case 'top':
          postsQuery = postsQuery.orderBy('posts.vote_count', 'desc');
          break;
        case 'hot': // Simple hot algorithm based on votes and time
          postsQuery = postsQuery.orderByRaw(
            '(posts.vote_count) / POWER(EXTRACT(EPOCH FROM NOW() - posts.created_at) / 3600 + 2, 1.8) DESC'
          );
          break;
      }

      const posts: Post[] = await postsQuery.limit(limit).offset(offset);

      // Get total post count for pagination
      const [{ count }] = await db('posts').where('is_removed', false).count();

      // If user is authenticated, get their votes for these posts
      // let userVotes = {};
      // if (req.user) {
      //   const votes = await db('post_votes')
      //     .whereIn(
      //       'post_id',
      //       posts.map(post => post.id)
      //     )
      //     .where('user_id', req.user.id)
      //     .select('post_id', 'vote_value');

      //   userVotes = votes.reduce((acc, vote) => {
      //     acc[vote.post_id] = vote.vote_value;
      //     return acc;
      //   }, {});
      // }

      // Add user_vote to each post
      const postsWithVotes = posts.map(post => ({
        ...post,
        // user_vote: userVotes[post.id] || 0,
      }));

      res.json({
        posts: postsWithVotes,
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          pages: Math.ceil(parseInt(count as string) / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }
);

// Pin or unpin a post (moderator only)
router.post(
  '/:id/pin',
  authenticateToken,
  param('id').isInt().toInt(),
  authenticateToken,
  async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if post exists
      const post = await db('posts').where({ id: postId }).first();
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user is a moderator or admin
      const isModerator = await db('subreddit_members')
        .where({
          user_id: userId,
          subreddit_id: post.subreddit_id,
          is_moderator: true,
        })
        .first();

      if (!isModerator && !req.user!.is_admin) {
        return res.status(403).json({ error: 'Only moderators can pin posts' });
      }

      // Toggle the pin status
      const newPinStatus = !post.is_pinned;

      await db('posts').where({ id: postId }).update({
        is_pinned: newPinStatus,
        updated_at: db.fn.now(),
      });

      res.json({
        message: `Post ${newPinStatus ? 'pinned' : 'unpinned'} successfully`,
        is_pinned: newPinStatus,
      });
    } catch (error) {
      console.error('Error pinning/unpinning post:', error);
      res.status(500).json({ error: 'Failed to pin/unpin post' });
    }
  }
);

export default router;

// Get posts for a specific subreddit
router.get(
  '/r/:subredditName',
  [
    param('subredditName').isString().trim().notEmpty(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sort').optional().isIn(['new', 'top', 'hot']),
  ],
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { subredditName } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sort = (req.query.sort as string) || 'hot';
      const offset = (page - 1) * limit;

      // Check if subreddit exists
      const subreddit = await db('subreddits')
        .where({ name: subredditName })
        .first();
      if (!subreddit) {
        return res.status(404).json({ error: 'Subreddit not found' });
      }

      // Check if subreddit is private (only for non-authenticated users)
      if (subreddit.is_private && !req.user) {
        return res.status(403).json({ error: 'This subreddit is private' });
      }

      // If private, check if user is a member
      if (subreddit.is_private && req.user) {
        const isMember = await db('subreddit_members')
          .where({
            user_id: req.user.id,
            subreddit_id: subreddit.id,
          })
          .first();

        if (!isMember && !req.user.is_admin) {
          return res.status(403).json({ error: 'This subreddit is private' });
        }
      }

      let postsQuery = db('posts')
        .join('users', 'posts.user_id', 'users.id')
        .where({
          'posts.subreddit_id': subreddit.id,
          'posts.is_removed': false,
        })
        .select(
          'posts.*',
          'users.username as author',
          'users.avatar_url as author_avatar'
        );

      // Apply sorting
      switch (sort) {
        case 'new':
          postsQuery = postsQuery.orderBy('posts.created_at', 'desc');
          break;
        case 'top':
          postsQuery = postsQuery.orderBy('posts.vote_count', 'desc');
          break;
        case 'hot':
          postsQuery = postsQuery.orderByRaw(
            '(posts.vote_count) / POWER(EXTRACT(EPOCH FROM NOW() - posts.created_at) / 3600 + 2, 1.8) DESC'
          );
          break;
      }

      // Pin posts at the top if any
      postsQuery = postsQuery.orderBy('posts.is_pinned', 'desc');

      const posts = await postsQuery.limit(limit).offset(offset);

      // Get total post count for pagination
      const [{ count }] = await db('posts')
        .where({
          subreddit_id: subreddit.id,
          is_removed: false,
        })
        .count();

      // If user is authenticated, get their votes for these posts
      // let userVotes = {};
      // if (req.user) {
      //   const votes = await db('post_votes')
      //     .whereIn(
      //       'post_id',
      //       posts.map(post => post.id)
      //     )
      //     .where('user_id', req.user.id)
      //     .select('post_id', 'vote_value');

      //   userVotes = votes.reduce((acc, vote) => {
      //     acc[vote.post_id] = vote.vote_value;
      //     return acc;
      //   }, {});
      // }

      // Add user_vote to each post
      const postsWithVotes = posts.map(post => ({
        ...post,
        // user_vote: userVotes[post.id] || 0,
      }));

      // Get membership info if user is authenticated
      let membershipInfo = null;
      if (req.user) {
        membershipInfo = await db('subreddit_members')
          .where({
            user_id: req.user.id,
            subreddit_id: subreddit.id,
          })
          .first();
      }

      res.json({
        subreddit: {
          ...subreddit,
          is_member: !!membershipInfo,
          is_moderator: membershipInfo ? membershipInfo.is_moderator : false,
        },
        posts: postsWithVotes,
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          pages: Math.ceil(parseInt(count as string) / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching subreddit posts:', error);
      res.status(500).json({ error: 'Failed to fetch subreddit posts' });
    }
  }
);

// Get a specific post by ID
router.get(
  '/:id',
  param('id').isInt().toInt(),
  authenticateToken,
  async (req, res) => {
    try {
      const postId = parseInt(req.params.id);

      const post = await db('posts')
        .join('users', 'posts.user_id', 'users.id')
        .join('subreddits', 'posts.subreddit_id', 'subreddits.id')
        .where('posts.id', postId)
        .select(
          'posts.*',
          'users.username as author',
          'users.avatar_url as author_avatar',
          'subreddits.name as subreddit_name',
          'subreddits.is_private'
        )
        .first();

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if subreddit is private (only for non-authenticated users)
      if (post.is_private && !req.user) {
        return res
          .status(403)
          .json({ error: 'This post is in a private subreddit' });
      }

      // If private, check if user is a member
      if (post.is_private && req.user) {
        const isMember = await db('subreddit_members')
          .where({
            user_id: req.user.id,
            subreddit_id: post.subreddit_id,
          })
          .first();

        if (!isMember && !req.user.is_admin) {
          return res
            .status(403)
            .json({ error: 'This post is in a private subreddit' });
        }
      }

      // If user is authenticated, get their vote for this post
      if (req.user) {
        const vote = await db('post_votes')
          .where({
            post_id: postId,
            user_id: req.user.id,
          })
          .first();

        post.user_vote = vote ? vote.vote_value : 0;
      } else {
        post.user_vote = 0;
      }

      res.json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  }
);

// Create a new post
router.post(
  '/',
  authenticateToken,
  [
    body('title').isString().trim().notEmpty().isLength({ max: 300 }),
    body('body').isString().optional(),
    body('url').isURL().optional(),
    body('post_type').isIn(['text', 'link', 'image', 'video']),
    body('subreddit_id').isInt().toInt(),
  ],
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const postData: PostCreationRequest = req.body;
      const userId = req.user!.id;

      // Validate based on post type
      switch (postData.post_type) {
        case 'text':
          if (!postData.body) {
            return res.status(400).json({ error: 'Text posts require a body' });
          }
          break;
        case 'link':
          if (!postData.url) {
            return res.status(400).json({ error: 'Link posts require a URL' });
          }
          break;
        case 'image':
        case 'video':
          if (!postData.url) {
            return res
              .status(400)
              .json({ error: `${postData.post_type} posts require a URL` });
          }
          break;
      }

      // Check if subreddit exists
      const subreddit = await db('subreddits')
        .where({ id: postData.subreddit_id })
        .first();
      if (!subreddit) {
        return res.status(404).json({ error: 'Subreddit not found' });
      }

      // Check if restricted (only members can post)
      if (subreddit.is_restricted || subreddit.is_private) {
        const isMember = await db('subreddit_members')
          .where({
            user_id: userId,
            subreddit_id: postData.subreddit_id,
          })
          .first();

        if (!isMember && !req.user!.is_admin) {
          return res
            .status(403)
            .json({ error: 'Only members can post in this subreddit' });
        }
      }

      // Create post and initial upvote in a transaction
      const newPost = await db.transaction<Post>(async trx => {
        // Insert the post
        const [postId] = await trx('posts')
          .insert({
            title: postData.title,
            body: postData.body,
            url: postData.url,
            post_type: postData.post_type,
            user_id: userId,
            subreddit_id: postData.subreddit_id,
            vote_count: 1, // Start with creator's upvote
          })
          .returning('id');

        // Add creator's upvote
        await trx('post_votes').insert({
          post_id: postId,
          user_id: userId,
          vote_value: 1,
        });

        // Increment user's post karma
        await trx('users').where({ id: userId }).increment('karma_post', 1);

        // Return the newly created post
        return await trx('posts')
          .join('users', 'posts.user_id', 'users.id')
          .join('subreddits', 'posts.subreddit_id', 'subreddits.id')
          .where('posts.id', postId)
          .select(
            'posts.*',
            'users.username as author',
            'users.avatar_url as author_avatar',
            'subreddits.name as subreddit_name'
          )
          .first();
      });

      // Add user_vote property
      newPost.user_vote = 1;

      res.status(201).json(newPost);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

// Update a post
router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isInt().toInt(),
    body('title')
      .isString()
      .trim()
      .notEmpty()
      .isLength({ max: 300 })
      .optional(),
    body('body').isString().optional(),
  ],
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { title, body } = req.body;

      // Check if post exists and belongs to the user
      const post = await db('posts').where({ id: postId }).first();

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user is the post owner or a moderator/admin
      const isModerator = await db('subreddit_members')
        .where({
          user_id: userId,
          subreddit_id: post.subreddit_id,
          is_moderator: true,
        })
        .first();

      if (post.user_id !== userId && !isModerator && !req.user!.is_admin) {
        return res
          .status(403)
          .json({ error: 'You can only edit your own posts' });
      }

      // Only text posts can be edited
      if (post.post_type !== 'text') {
        return res.status(400).json({ error: 'Only text posts can be edited' });
      }

      // Update the post
      const updates: Partial<Post> = {};

      if (title) updates.title = title;
      if (body !== undefined) updates.body = body;

      await db('posts')
        .where({ id: postId })
        .update({
          ...updates,
          updated_at: db.fn.now(),
        });

      // Get the updated post
      const updatedPost = await db('posts')
        .join('users', 'posts.user_id', 'users.id')
        .join('subreddits', 'posts.subreddit_id', 'subreddits.id')
        .where('posts.id', postId)
        .select(
          'posts.*',
          'users.username as author',
          'users.avatar_url as author_avatar',
          'subreddits.name as subreddit_name'
        )
        .first();

      // Add user vote info
      const vote = await db('post_votes')
        .where({
          post_id: postId,
          user_id: userId,
        })
        .first();

      updatedPost.user_vote = vote ? vote.vote_value : 0;

      res.json(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  }
);

// Delete a post
router.delete(
  '/:id',
  param('id').isInt().toInt(),
  authenticateToken,
  async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if post exists
      const post = await db('posts').where({ id: postId }).first();

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user is the post owner, a moderator, or an admin
      const isModerator = await db('subreddit_members')
        .where({
          user_id: userId,
          subreddit_id: post.subreddit_id,
          is_moderator: true,
        })
        .first();

      if (post.user_id !== userId && !isModerator && !req.user!.is_admin) {
        return res
          .status(403)
          .json({ error: 'You can only delete your own posts' });
      }

      // Soft delete by marking as removed
      await db('posts').where({ id: postId }).update({
        is_removed: true,
        updated_at: db.fn.now(),
      });

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  }
);

// Vote on a post
router.post(
  '/:id/vote',
  [
    param('id').isInt().toInt(),
    body('vote_value').isInt({ min: -1, max: 1 }).toInt(),
  ],
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { vote_value }: VoteRequest = req.body;

      // Check if post exists and is not removed
      const post = await db('posts')
        .where({
          id: postId,
          is_removed: false,
        })
        .first();

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if post is in a private subreddit and user is a member
      const subreddit = await db('subreddits')
        .where({ id: post.subreddit_id })
        .first();

      if (subreddit.is_private) {
        const isMember = await db('subreddit_members')
          .where({
            user_id: userId,
            subreddit_id: subreddit.id,
          })
          .first();

        if (!isMember && !req.user!.is_admin) {
          return res.status(403).json({
            error:
              'Cannot vote on posts in private subreddits you are not a member of',
          });
        }
      }

      // Handle the vote in a transaction
      await db.transaction(async trx => {
        // Get the existing vote if any
        const existingVote = await trx('post_votes')
          .where({
            post_id: postId,
            user_id: userId,
          })
          .first();

        if (existingVote) {
          const oldValue = existingVote.vote_value;

          if (oldValue === vote_value) {
            // If voting the same way again, remove the vote (toggle)
            await trx('post_votes')
              .where({
                post_id: postId,
                user_id: userId,
              })
              .delete();

            // Update post vote count
            await trx('posts')
              .where({ id: postId })
              .decrement('vote_count', oldValue);

            // Update user karma if not their own post
            if (post.user_id !== userId) {
              await trx('users')
                .where({ id: post.user_id })
                .decrement('karma_post', oldValue);
            }
          } else {
            // If voting differently, update the vote
            await trx('post_votes')
              .where({
                post_id: postId,
                user_id: userId,
              })
              .update({
                vote_value,
                updated_at: trx.fn.now(),
              });

            // Update post vote count (adjust by the difference)
            const voteDiff = vote_value - oldValue;
            await trx('posts')
              .where({ id: postId })
              .increment('vote_count', voteDiff);

            // Update user karma if not their own post
            if (post.user_id !== userId) {
              await trx('users')
                .where({ id: post.user_id })
                .increment('karma_post', voteDiff);
            }
          }
        } else if (vote_value !== 0) {
          // If no existing vote and value is not 0, create a new vote
          await trx('post_votes').insert({
            post_id: postId,
            user_id: userId,
            vote_value,
          });

          // Update post vote count
          await trx('posts')
            .where({ id: postId })
            .increment('vote_count', vote_value);

          // Update user karma if not their own post
          if (post.user_id !== userId) {
            await trx('users')
              .where({ id: post.user_id })
              .increment('karma_post', vote_value);
          }
        }
      });

      // Get updated post data
      const updatedPost = await db('posts').where({ id: postId }).first();

      res.json({
        message: 'Vote recorded successfully',
        post_id: postId,
        new_vote_value: vote_value,
        vote_count: updatedPost.vote_count,
      });
    } catch (error) {
      console.error('Error voting on post:', error);
      res.status(500).json({ error: 'Failed to vote on post' });
    }
  }
);
