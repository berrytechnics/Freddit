import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { db } from "../db/connection";
import { authAPI as auth } from "../middleware/auth.middleware";
import { Comment, CommentCreationRequest } from "../models/types";

const router = express.Router();

// Validation middleware
const commentValidation = [
  body("body")
    .notEmpty()
    .withMessage("Comment body is required")
    .isLength({ max: 10000 })
    .withMessage("Comment body cannot exceed 10000 characters"),
  body("post_id")
    .notEmpty()
    .withMessage("Post ID is required")
    .isInt()
    .withMessage("Post ID must be an integer"),
  body("parent_comment_id")
    .optional()
    .isInt()
    .withMessage("Parent comment ID must be an integer"),
];

const voteValidation = [
  body("vote_value")
    .isIn([-1, 0, 1])
    .withMessage("Vote value must be -1, 0, or 1"),
];

// Get comments for a post (with threaded structure)
router.get("/post/:postId", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    // Check if post exists
    const post = await db("posts").where({ id: postId }).first();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get all comments for the post
    const comments = await db<Comment>("comments")
      .select(["comments.*", db.raw("users.username as user_username")])
      .where({ post_id: postId, is_removed: false })
      .join("users", "comments.user_id", "users.id")
      .orderBy("created_at", "asc");

    // Format the comments
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      vote_count: comment.vote_count,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      post_id: comment.post_id,
      parent_comment_id: comment.parent_comment_id,
      user: {
        id: comment.user_id,
        username: comment.user_username,
      },
    }));

    return res.json(formattedComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Create a comment
router.post(
  "/",
  auth,
  commentValidation,
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { body, post_id, parent_comment_id }: CommentCreationRequest =
        req.body;

      // Check if post exists
      const post = await db("posts").where({ id: post_id }).first();

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // If parent_comment_id is provided, check if it exists
      if (parent_comment_id) {
        const parentComment = await db("comments")
          .where({ id: parent_comment_id })
          .first();

        if (!parentComment) {
          return res.status(404).json({ message: "Parent comment not found" });
        }

        // Make sure parent comment belongs to the same post
        if (parentComment.post_id !== post_id) {
          return res.status(400).json({
            message: "Parent comment does not belong to the specified post",
          });
        }
      }

      // Create comment
      const [newComment] = await db<Comment>("comments")
        .insert({
          body,
          post_id,
          parent_comment_id,
          user_id: req.user!.id,
          vote_count: 1, // Default upvote by the author
          is_removed: false,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");

      // Add an upvote record for the comment's author
      await db("comment_votes").insert({
        comment_id: newComment.id,
        user_id: req.user!.id,
        vote_value: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Increment the post's comment count
      await db("posts").where({ id: post_id }).increment("comment_count", 1);

      // Get the user information
      const user = await db("users")
        .select("id", "username")
        .where({ id: req.user!.id })
        .first();

      // Format the response
      const formattedComment = {
        ...newComment,
        user: {
          id: user.id,
          username: user.username,
        },
      };

      return res.status(201).json(formattedComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Update a comment
router.put("/:id", auth, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);
    const { body } = req.body;

    if (isNaN(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    if (!body || body.trim() === "") {
      return res.status(400).json({ message: "Comment body is required" });
    }

    // Check if comment exists and belongs to the user
    const comment = await db<Comment>("comments")
      .where({ id: commentId })
      .first();

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user_id !== req.user!.id) {
      return res
        .status(403)
        .json({ message: "You can only edit your own comments" });
    }

    // Update comment
    const [updatedComment] = await db<Comment>("comments")
      .where({ id: commentId })
      .update({
        body,
        updated_at: new Date(),
      })
      .returning("*");

    // Get the user information
    const user = await db("users")
      .select("id", "username")
      .where({ id: updatedComment.user_id })
      .first();

    // Format the response
    const formattedComment = {
      ...updatedComment,
      user: {
        id: user.id,
        username: user.username,
      },
    };

    return res.json(formattedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete a comment (soft delete)
router.delete("/:id", auth, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    // Check if comment exists and belongs to the user
    const comment = await db<Comment>("comments")
      .where({ id: commentId })
      .first();

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Allow admins to delete any comment
    const user = await db("users").where({ id: req.user!.id }).first();
    const isAdmin = user.is_admin;

    if (comment.user_id !== req.user!.id && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    // Soft delete the comment (mark as removed but keep in database)
    await db<Comment>("comments").where({ id: commentId }).update({
      body: "[deleted]",
      is_removed: true,
      updated_at: new Date(),
    });

    return res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Vote on a comment
router.post(
  "/:id/vote",
  auth,
  voteValidation,
  async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      const { vote_value } = req.body;

      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      // Check if comment exists
      const comment = await db<Comment>("comments")
        .where({ id: commentId })
        .first();

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user has already voted
      const existingVote = await db("comment_votes")
        .where({
          comment_id: commentId,
          user_id: req.user!.id,
        })
        .first();

      let voteChange = 0;

      if (existingVote) {
        // Update existing vote
        if (existingVote.vote_value !== vote_value) {
          // Calculate vote change
          voteChange = vote_value - existingVote.vote_value;

          if (vote_value === 0) {
            // Remove the vote
            await db("comment_votes")
              .where({
                comment_id: commentId,
                user_id: req.user!.id,
              })
              .delete();
          } else {
            // Update the vote
            await db("comment_votes")
              .where({
                comment_id: commentId,
                user_id: req.user!.id,
              })
              .update({
                vote_value,
                updated_at: new Date(),
              });
          }
        }
      } else if (vote_value !== 0) {
        // Create new vote
        voteChange = vote_value;

        await db("comment_votes").insert({
          comment_id: commentId,
          user_id: req.user!.id,
          vote_value,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Update comment vote count
      if (voteChange !== 0) {
        await db<Comment>("comments")
          .where({ id: commentId })
          .increment("vote_count", voteChange);

        // Update user karma for the comment author
        await db("users")
          .where({ id: comment.user_id })
          .increment("karma_comment", voteChange);
      }

      // Get updated vote count
      const updatedComment = await db<Comment>("comments")
        .where({ id: commentId })
        .first();

      return res.json({ vote_count: updatedComment.vote_count });
    } catch (error) {
      console.error("Error voting on comment:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
