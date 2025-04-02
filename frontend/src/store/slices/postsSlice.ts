import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { Post, postsAPI } from "../../lib/api";

// Define a type for the slice state
interface PostsState {
  items: Post[];
  currentPost: Post | null;
  loading: boolean;
  error: string | null;
}

// Define the initial state
const initialState: PostsState = {
  items: [],
  currentPost: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async (
    params: { sort?: string; page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await postsAPI.getAll(params);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch posts." }
      );
    }
  }
);

export const fetchPostsBySubreddit = createAsyncThunk(
  "posts/fetchPostsBySubreddit",
  async (
    {
      subredditName,
      params,
    }: {
      subredditName: string;
      params?: { sort?: string; page?: number; limit?: number };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await postsAPI.getBySubreddit(subredditName, params);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch subreddit posts." }
      );
    }
  }
);

export const fetchPostById = createAsyncThunk(
  "posts/fetchPostById",
  async (postId: number, { rejectWithValue }) => {
    try {
      const response = await postsAPI.getById(postId);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch post." }
      );
    }
  }
);

export const createPost = createAsyncThunk(
  "posts/createPost",
  async (
    postData: {
      title: string;
      body?: string;
      url?: string;
      post_type: string;
      subreddit_id: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await postsAPI.create(postData);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to create post." }
      );
    }
  }
);

export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async (
    {
      id,
      data,
    }: {
      id: number;
      data: { title?: string; body?: string; url?: string };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await postsAPI.update(id, data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to update post." }
      );
    }
  }
);

export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (postId: number, { rejectWithValue }) => {
    try {
      await postsAPI.delete(postId);
      return postId;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete post." }
      );
    }
  }
);

export const votePost = createAsyncThunk(
  "posts/votePost",
  async (
    { id, vote }: { id: number; vote: 1 | 0 | -1 },
    { rejectWithValue }
  ) => {
    try {
      const response = await postsAPI.vote(id, vote);
      return { id, vote_count: response.data.vote_count };
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to vote on post." }
      );
    }
  }
);

// Create the slice
const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    clearPosts: (state) => {
      state.items = [];
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<Post[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch posts by subreddit
      .addCase(fetchPostsBySubreddit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPostsBySubreddit.fulfilled,
        (state, action: PayloadAction<Post[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchPostsBySubreddit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch post by ID
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPostById.fulfilled,
        (state, action: PayloadAction<Post>) => {
          state.loading = false;
          state.currentPost = action.payload;
        }
      )
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create post
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.loading = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update post
      .addCase(updatePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.loading = false;
        state.items = state.items.map((post) =>
          post.id === action.payload.id ? action.payload : post
        );
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload;
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete post
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.items = state.items.filter((post) => post.id !== action.payload);
        if (state.currentPost?.id === action.payload) {
          state.currentPost = null;
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Vote on post
      .addCase(
        votePost.fulfilled,
        (state, action: PayloadAction<{ id: number; vote_count: number }>) => {
          state.items = state.items.map((post) =>
            post.id === action.payload.id
              ? { ...post, vote_count: action.payload.vote_count }
              : post
          );
          if (state.currentPost?.id === action.payload.id) {
            state.currentPost = {
              ...state.currentPost,
              vote_count: action.payload.vote_count,
            };
          }
        }
      );
  },
});

export const { clearPosts, clearCurrentPost, clearError } = postsSlice.actions;

export default postsSlice.reducer;
