import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createComment,
  fetchPostComments,
} from "../store/slices/commentsSlice";
import Comment from "./Comment";

interface CommentSectionProps {
  postId: number;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    items: comments,
    loading,
    error,
  } = useAppSelector((state) => state.comments);

  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    dispatch(fetchPostComments(postId));
  }, [dispatch, postId]);

  const handleSubmitComment = () => {
    if (commentBody.trim()) {
      dispatch(
        createComment({
          body: commentBody,
          post_id: postId,
        })
      ).then(() => {
        setCommentBody("");
        // Refresh comments after posting
        dispatch(fetchPostComments(postId));
      });
    }
  };

  const sortOptions = [
    { label: "Best", value: "best" },
    { label: "Top", value: "top" },
    { label: "New", value: "new" },
    { label: "Controversial", value: "controversial" },
    { label: "Old", value: "old" },
  ];

  const [sortBy, setSortBy] = useState("best");

  return (
    <div className="bg-white rounded-md shadow border border-gray-300 p-4">
      <div className="mb-5">
        <h3 className="text-lg font-semibold mb-3">Comments</h3>

        {/* Sort dropdown */}
        <div className="flex items-center mb-4">
          <span className="text-xs text-gray-500">Sort by: </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ml-2 text-xs bg-transparent text-gray-500 font-semibold border-none focus:ring-0 cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Comment input form */}
        {user ? (
          <div className="mb-5">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What are your thoughts?"
              rows={4}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSubmitComment}
                disabled={!commentBody.trim()}
                className="px-4 py-1 text-sm text-white bg-reddit-blue rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comment
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-3 text-center border border-gray-200 rounded-md mb-4">
            <p className="text-sm text-gray-700 mb-2">
              Log in or sign up to leave a comment
            </p>
            <div className="flex justify-center space-x-2">
              <a
                href="/login"
                className="px-4 py-1 text-sm bg-white text-reddit-blue border border-reddit-blue rounded-full"
              >
                Log In
              </a>
              <a
                href="/signup"
                className="px-4 py-1 text-sm bg-reddit-blue text-white rounded-full"
              >
                Sign Up
              </a>
            </div>
          </div>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No comments yet. Be the first to share what you think!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
