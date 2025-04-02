# Reddit Clone

A full-stack Reddit clone built with Next.js, Express, TypeScript, and PostgreSQL, running in Docker containers.

## Features

- User authentication (register, login, logout)
- Create and join communities (subreddits)
- Create posts (text, link, image)
- Comment on posts with threaded replies
- Upvote/downvote posts and comments
- User profiles
- Responsive design

## Tech Stack

### Backend

- **Express.js**: Node.js web application framework
- **TypeScript**: Static typing for JavaScript
- **PostgreSQL**: Relational database
- **Knex.js**: SQL query builder
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing

### Frontend

- **Next.js**: React framework for server-side rendering
- **TypeScript**: Static typing for JavaScript
- **Redux Toolkit**: State management
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client

### DevOps

- **Docker**: Containerization
- **Docker Compose**: Multi-container Docker applications

## Project Structure

```
.
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── db/            # Database connection and migrations
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # TypeScript interfaces
│   │   └── routes/        # API routes
│   ├── Dockerfile         # Backend Docker configuration
│   └── tsconfig.json      # TypeScript configuration
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility functions and API client
│   │   ├── pages/         # Next.js pages
│   │   ├── store/         # Redux store and slices
│   │   └── styles/        # CSS styles
│   ├── Dockerfile         # Frontend Docker configuration
│   └── tsconfig.json      # TypeScript configuration
└── docker-compose.yml     # Docker Compose configuration
```

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed on your system
- Git

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/reddit-clone.git
   cd reddit-clone
   ```

2. Create the necessary directory structure:

   ```bash
   mkdir -p backend/src/{db,middleware,models,routes}
   mkdir -p frontend/src/{components,lib,pages,store,styles}
   ```

3. Start the application using Docker Compose:

   ```bash
   docker-compose up
   ```

4. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Database Migration

To run database migrations inside the Docker container:

```bash
docker-compose exec backend npx knex migrate:latest
```

## Development Workflow

1. Start the containers in development mode:

   ```bash
   docker-compose up
   ```

2. Make changes to the code - the application will automatically reload

3. To stop the containers:
   ```bash
   docker-compose down
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Users

- `GET /api/users/:username` - Get user profile
- `GET /api/users/:username/posts` - Get user's posts
- `GET /api/users/:username/comments` - Get user's comments
- `PUT /api/users/me` - Update current user's profile

### Subreddits

- `GET /api/subreddits` - Get all subreddits
- `GET /api/subreddits/r/:name` - Get subreddit by name
- `POST /api/subreddits` - Create a new subreddit
- `POST /api/subreddits/:id/subscribe` - Subscribe to a subreddit
- `POST /api/subreddits/:id/unsubscribe` - Unsubscribe from a subreddit

### Posts

- `GET /api/posts` - Get all posts
- `GET /api/posts/r/:subredditName` - Get posts by subreddit
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create a new post
- `PUT /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post
- `POST /api/posts/:id/vote` - Vote on a post

### Comments

- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create a new comment
- `PUT /api/comments/:id` - Update a comment
- `DELETE /api/comments/:id` - Delete a comment
- `POST /api/comments/:id/vote` - Vote on a comment

## Deployment

For production deployment, additional configuration is required:

1. Update environment variables for production
2. Set up a production database
3. Configure a reverse proxy (e.g., Nginx)
4. Set up SSL certificates

## Future Improvements

- Add image uploading with S3 or similar service
- Implement real-time notifications
- Add search functionality
- Implement user moderation tools
- Add OAuth authentication options

## License

MIT
