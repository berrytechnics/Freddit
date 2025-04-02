import cors from "cors";
import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import { setupDbConnection } from "./db/connection";

// Import routes (we'll create these TypeScript files later)
import authRoutes from "./routes/auth.routes";
// import commentRoutes from "./routes/comment.routes";
// import postRoutes from "./routes/post.routes";
// import subredditRoutes from "./routes/subreddit.routes";
// import userRoutes from "./routes/user.routes";

// Initialize express app
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "3001", 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// API routes
app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/subreddits", subredditRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/comments", commentRoutes);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Setup database connection
setupDbConnection();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
