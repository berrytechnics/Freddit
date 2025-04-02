import axios, { AxiosError, AxiosResponse } from 'axios';

// API client configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth token to requests if available
apiClient.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    // Handle auth errors (redirect to login)
    if (error.response?.status === 401) {
      // Only redirect if we're in a browser environment and not on the auth page
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  username: string;
  display_name?: string;
  karma_post: number;
  karma_comment: number;
  is_admin: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Subreddit {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  banner_url?: string;
  icon_url?: string;
  is_private: boolean;
  is_restricted: boolean;
  subscribers_count?: number;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  body?: string;
  url?: string;
  post_type: 'text' | 'link' | 'image' | 'video';
  vote_count: number;
  comment_count: number;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
  subreddit: {
    id: number;
    name: string;
  };
}

export interface Comment {
  id: number;
  body: string;
  vote_count: number;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
  replies?: Comment[];
}

// Auth API calls
export const authAPI = {
  register: (userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post('/auth/register', userData),

  login: (credentials: {
    username: string;
    password: string;
  }): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post('/auth/login', credentials),

  getCurrentUser: (): Promise<AxiosResponse<User>> => apiClient.get('/auth/me'),
};

// Subreddits API calls
export const subredditsAPI = {
  getAll: (params?: {
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<Subreddit[]>> =>
    apiClient.get('/subreddits', { params }),

  getByName: (name: string): Promise<AxiosResponse<Subreddit>> =>
    apiClient.get(`/subreddits/r/${name}`),

  create: (data: {
    name: string;
    display_name?: string;
    description?: string;
  }): Promise<AxiosResponse<Subreddit>> => apiClient.post('/subreddits', data),

  subscribe: (
    subredditId: number
  ): Promise<AxiosResponse<{ subscribed: boolean }>> =>
    apiClient.post(`/subreddits/${subredditId}/subscribe`),

  unsubscribe: (
    subredditId: number
  ): Promise<AxiosResponse<{ subscribed: boolean }>> =>
    apiClient.post(`/subreddits/${subredditId}/unsubscribe`),
};

// Posts API calls
export const postsAPI = {
  getAll: (params?: {
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<Post[]>> => apiClient.get('/posts', { params }),

  getBySubreddit: (
    subredditName: string,
    params?: { sort?: string; page?: number; limit?: number }
  ): Promise<AxiosResponse<Post[]>> =>
    apiClient.get(`/posts/r/${subredditName}`, { params }),

  getById: (id: number): Promise<AxiosResponse<Post>> =>
    apiClient.get(`/posts/${id}`),

  create: (data: {
    title: string;
    body?: string;
    url?: string;
    post_type: string;
    subreddit_id: number;
  }): Promise<AxiosResponse<Post>> => apiClient.post('/posts', data),

  update: (
    id: number,
    data: { title?: string; body?: string; url?: string }
  ): Promise<AxiosResponse<Post>> => apiClient.put(`/posts/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<{ success: boolean }>> =>
    apiClient.delete(`/posts/${id}`),

  vote: (
    id: number,
    vote: 1 | 0 | -1
  ): Promise<AxiosResponse<{ vote_count: number }>> =>
    apiClient.post(`/posts/${id}/vote`, { vote_value: vote }),
};

// Comments API calls
export const commentsAPI = {
  getByPost: (postId: number): Promise<AxiosResponse<Comment[]>> =>
    apiClient.get(`/comments/post/${postId}`),

  create: (data: {
    body: string;
    post_id: number;
    parent_comment_id?: number;
  }): Promise<AxiosResponse<Comment>> => apiClient.post('/comments', data),

  update: (
    id: number,
    data: { body: string }
  ): Promise<AxiosResponse<Comment>> => apiClient.put(`/comments/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<{ success: boolean }>> =>
    apiClient.delete(`/comments/${id}`),

  vote: (
    id: number,
    vote: 1 | 0 | -1
  ): Promise<AxiosResponse<{ vote_count: number }>> =>
    apiClient.post(`/comments/${id}/vote`, { vote_value: vote }),
};

// User API calls
export const usersAPI = {
  getProfile: (username: string): Promise<AxiosResponse<User>> =>
    apiClient.get(`/users/${username}`),

  getPosts: (
    username: string,
    params?: { sort?: string; page?: number; limit?: number }
  ): Promise<AxiosResponse<Post[]>> =>
    apiClient.get(`/users/${username}/posts`, { params }),

  getComments: (
    username: string,
    params?: { sort?: string; page?: number; limit?: number }
  ): Promise<AxiosResponse<Comment[]>> =>
    apiClient.get(`/users/${username}/comments`, { params }),

  updateProfile: (data: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<AxiosResponse<User>> => apiClient.put('/users/me', data),
};
