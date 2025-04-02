// User model
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  karma_post: number;
  karma_comment: number;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

// User registration request
export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
}

// User login request
export interface UserLoginRequest {
  username: string;
  password: string;
}

// Subreddit model
export interface Subreddit {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  banner_url?: string;
  icon_url?: string;
  is_private: boolean;
  is_restricted: boolean;
  creator_id: number | null;
  created_at: Date;
  updated_at: Date;
}

// Subreddit creation request
export interface SubredditCreationRequest {
  name: string;
  display_name?: string;
  description?: string;
  is_private?: boolean;
  is_restricted?: boolean;
}

// Post model
export interface Post {
  id: number;
  title: string;
  body?: string;
  url?: string;
  post_type: "text" | "link" | "image" | "video";
  vote_count: number;
  comment_count: number;
  user_id: number;
  subreddit_id: number;
  is_pinned: boolean;
  is_removed: boolean;
  created_at: Date;
  updated_at: Date;
}

// Post creation request
export interface PostCreationRequest {
  title: string;
  body?: string;
  url?: string;
  post_type: "text" | "link" | "image" | "video";
  subreddit_id: number;
}

// Comment model
export interface Comment {
  id: number;
  body: string;
  vote_count: number;
  user_id: number;
  post_id: number;
  parent_comment_id?: number;
  is_removed: boolean;
  created_at: Date;
  updated_at: Date;
}

// Comment creation request
export interface CommentCreationRequest {
  body: string;
  post_id: number;
  parent_comment_id?: number;
}

// Vote models
export interface PostVote {
  id: number;
  post_id: number;
  user_id: number;
  vote_value: -1 | 0 | 1;
  created_at: Date;
  updated_at: Date;
}

export interface CommentVote {
  id: number;
  comment_id: number;
  user_id: number;
  vote_value: -1 | 0 | 1;
  created_at: Date;
  updated_at: Date;
}

// Vote request
export interface VoteRequest {
  vote_value: -1 | 0 | 1;
}

// Auth token response
export interface AuthTokenResponse {
  token: string;
  user: {
    id: number;
    username: string;
    display_name?: string;
    karma_post: number;
    karma_comment: number;
    is_admin: boolean;
  };
}
