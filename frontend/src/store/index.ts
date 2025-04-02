import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import commentsReducer from "./slices/commentsSlice";
import postsReducer from "./slices/postsSlice";
import subredditsReducer from "./slices/subredditsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    subreddits: subredditsReducer,
    comments: commentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in the listed paths
        ignoredActions: ["auth/loginSuccess", "auth/registerSuccess"],
        ignoredPaths: ["auth.user"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
