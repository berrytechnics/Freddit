import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { Comment, commentsAPI } from "../../lib/api";

// Define a type for the slice state
interface CommentsState {
  items: Comment[];
  loading: boolean;
  error: string | null;
}

// Define the initial state
const initialState: CommentsState = {
  items: [],
  loading: false,
  error: null,
};

// Function to organize comments into a threaded structure
const organizeComments = (comments: Comment[]): Comment[] => {
  const commentMap = new Map<number, Comment>();
  const rootComments: Comment[] = [];

  // First pass: create a map of all comments
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize comments into threads
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id);
    if (!commentWithReplies) return;

    if (comment.parent_comment_id) {
      // This is a reply, add it to its parent
      const parentComment = commentMap.get(comment.parent_comment_id);
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(commentWithReplies);
      }
    } else {
      // This is a root comment
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
};

// Async thunks
export const fetchPostComments = createAsyncThunk(
  "comments/fetchPostComments",
  async (postId: number, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.getByPost(postId);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch comments." }
      );
    }
  }
);

export const createComment = createAsyncThunk(
  "comments/createComment",
  async (
    commentData: { body: string; post_id: number; parent_comment_id?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await commentsAPI.create(commentData);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to create comment." }
      );
    }
  }
);

export const updateComment = createAsyncThunk(
  "comments/updateComment",
  async ({ id, body }: { id: number; body: string }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.update(id, { body });
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to update comment." }
      );
    }
  }
);

export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async (commentId: number, { rejectWithValue }) => {
    try {
      await commentsAPI.delete(commentId);
      return commentId;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete comment." }
      );
    }
  }
);

export const voteComment = createAsyncThunk(
  "comments/voteComment",
  async (
    { id, vote }: { id: number; vote: 1 | 0 | -1 },
    { rejectWithValue }
  ) => {
    try {
      const response = await commentsAPI.vote(id, vote);
      return { id, vote_count: response.data.vote_count };
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to vote on comment." }
      );
    }
  }
);

// Create the slice
const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearComments: (state) => {
      state.items = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch post comments
      .addCase(fetchPostComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPostComments.fulfilled,
        (state, action: PayloadAction<Comment[]>) => {
          state.loading = false;
          state.items = organizeComments(action.payload);
        }
      )
      .addCase(fetchPostComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create comment
      .addCase(createComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createComment.fulfilled,
        (state, action: PayloadAction<Comment>) => {
          state.loading = false;
          // Refetch comments to get the updated thread structure
          // This is a bit of a crude approach but ensures proper threading
          // In a more refined version, we could update the state directly
        }
      )
      .addCase(createComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update comment
      .addCase(updateComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateComment.fulfilled,
        (state, action: PayloadAction<Comment>) => {
          state.loading = false;
          // Update the comment in the flat list
          // We'll handle updating nested comments recursively
          const updateCommentInTree = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === action.payload.id) {
                return { ...comment, body: action.payload.body };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentInTree(comment.replies),
                };
              }
              return comment;
            });
          };

          state.items = updateCommentInTree(state.items);
        }
      )
      .addCase(updateComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete comment
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteComment.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.loading = false;
          // Remove the comment from the flat list
          // We'll handle deleting nested comments recursively
          const deleteCommentFromTree = (comments: Comment[]): Comment[] => {
            return comments
              .filter((comment) => comment.id !== action.payload)
              .map((comment) => {
                if (comment.replies && comment.replies.length > 0) {
                  return {
                    ...comment,
                    replies: deleteCommentFromTree(comment.replies),
                  };
                }
                return comment;
              });
          };

          state.items = deleteCommentFromTree(state.items);
        }
      )
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Vote on comment
      .addCase(
        voteComment.fulfilled,
        (state, action: PayloadAction<{ id: number; vote_count: number }>) => {
          // Update vote count for the comment
          const updateVoteInTree = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === action.payload.id) {
                return { ...comment, vote_count: action.payload.vote_count };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateVoteInTree(comment.replies),
                };
              }
              return comment;
            });
          };

          state.items = updateVoteInTree(state.items);
        }
      );
  },
});

export const { clearComments, clearError } = commentsSlice.actions;

export default commentsSlice.reducer;
