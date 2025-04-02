import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { Subreddit, subredditsAPI } from "../../lib/api";

// Define a type for the slice state
interface SubredditsState {
  items: Subreddit[];
  currentSubreddit: Subreddit | null;
  subscriptions: Subreddit[];
  loading: boolean;
  error: string | null;
}

// Define the initial state
const initialState: SubredditsState = {
  items: [],
  currentSubreddit: null,
  subscriptions: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchSubreddits = createAsyncThunk(
  "subreddits/fetchSubreddits",
  async (
    params: { sort?: string; page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await subredditsAPI.getAll(params);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch subreddits." }
      );
    }
  }
);

export const fetchSubredditByName = createAsyncThunk(
  "subreddits/fetchSubredditByName",
  async (name: string, { rejectWithValue }) => {
    try {
      const response = await subredditsAPI.getByName(name);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch subreddit." }
      );
    }
  }
);

export const createSubreddit = createAsyncThunk(
  "subreddits/createSubreddit",
  async (
    data: { name: string; display_name?: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await subredditsAPI.create(data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to create subreddit." }
      );
    }
  }
);

export const subscribeToSubreddit = createAsyncThunk(
  "subreddits/subscribeToSubreddit",
  async (subredditId: number, { rejectWithValue }) => {
    try {
      const response = await subredditsAPI.subscribe(subredditId);
      return { subredditId, subscribed: response.data.subscribed };
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || { message: "Failed to subscribe to subreddit." }
      );
    }
  }
);

export const unsubscribeFromSubreddit = createAsyncThunk(
  "subreddits/unsubscribeFromSubreddit",
  async (subredditId: number, { rejectWithValue }) => {
    try {
      const response = await subredditsAPI.unsubscribe(subredditId);
      return { subredditId, subscribed: response.data.subscribed };
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to unsubscribe from subreddit.",
        }
      );
    }
  }
);

// Create the slice
const subredditsSlice = createSlice({
  name: "subreddits",
  initialState,
  reducers: {
    clearSubreddits: (state) => {
      state.items = [];
    },
    clearCurrentSubreddit: (state) => {
      state.currentSubreddit = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all subreddits
      .addCase(fetchSubreddits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSubreddits.fulfilled,
        (state, action: PayloadAction<Subreddit[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchSubreddits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch subreddit by name
      .addCase(fetchSubredditByName.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSubredditByName.fulfilled,
        (state, action: PayloadAction<Subreddit>) => {
          state.loading = false;
          state.currentSubreddit = action.payload;
        }
      )
      .addCase(fetchSubredditByName.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create subreddit
      .addCase(createSubreddit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createSubreddit.fulfilled,
        (state, action: PayloadAction<Subreddit>) => {
          state.loading = false;
          state.items = [action.payload, ...state.items];
          state.currentSubreddit = action.payload;
        }
      )
      .addCase(createSubreddit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Subscribe to subreddit
      .addCase(subscribeToSubreddit.fulfilled, (state, action) => {
        // If the subscription was successful, update the subscriptions list
        if (action.payload.subscribed) {
          const subreddit = state.items.find(
            (sub) => sub.id === action.payload.subredditId
          );
          if (
            subreddit &&
            !state.subscriptions.some((sub) => sub.id === subreddit.id)
          ) {
            state.subscriptions.push(subreddit);
          }
        }
      })

      // Unsubscribe from subreddit
      .addCase(unsubscribeFromSubreddit.fulfilled, (state, action) => {
        // If the unsubscription was successful, update the subscriptions list
        if (!action.payload.subscribed) {
          state.subscriptions = state.subscriptions.filter(
            (sub) => sub.id !== action.payload.subredditId
          );
        }
      });
  },
});

export const { clearSubreddits, clearCurrentSubreddit, clearError } =
  subredditsSlice.actions;

export default subredditsSlice.reducer;
