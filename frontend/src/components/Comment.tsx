import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { FaArrowDown, FaArrowUp, FaEllipsisH, FaReply } from "react-icons/fa";
import { Comment as CommentType } from "../lib/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createComment,
  deleteComment,
  updateComment,
  voteComment,
} from "../store/slices/commentsSlice";

interface CommentProps {
  comment: CommentType;
  postId: number;
  level?: number;
}

const Comment = ({ comment, postId, level = 0 }: CommentProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editedBody, setEditedBody] = useState(comment.body);
  const [replyBody, setReplyBody] = useState("");

  const isOwnComment = user?.id === comment.user.id;
  const maxLevel = 6; // Maximum nesting level for visual styling
  const currentLevel = level > maxLevel ? maxLevel : level;

  // Format the comment creation date
  const formattedDate = comment.created_at
    ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
    : "recently";

  const handleVote = (voteValue: 1 | 0 | -1) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    dispatch(voteComment({ id: comment.id, vote: voteValue }));
  };

  const handleEditSubmit = () => {
    if (editedBody.trim()) {
      dispatch(updateComment({ id: comment.id, body: editedBody })).then(() => {
        setIsEditing(false);
      });
    }
  };

  const handleReplySubmit = () => {
    if (replyBody.trim()) {
      dispatch(
        createComment({
          body: replyBody,
          post_id: postId,
          parent_comment_id: comment.id,
        })
      ).then(() => {
        setIsReplying(false);
        setReplyBody("");
      });
    }
  };

  const handleDeleteComment = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      dispatch(deleteComment(comment.id));
    }
    setShowMenu(false);
  };

  return (
    <div
      className={`mb-3 ${
        level > 0 ? "ml-5 pl-3 border-l-2 border-gray-200" : ""
      }`}
    >
      {/* Comment header */}
      <div className="flex items-center text-xs text-gray-500 mb-1">
        <Link
          href={`/u/${comment.user.username}`}
          className="font-medium text-gray-900 hover:underline"
        >
          u/{comment.user.username}
        </Link>
        <span className="mx-1">•</span>
        <span>{formattedDate}</span>

        {isOwnComment && (
          <div className="relative ml-auto">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center hover:bg-gray-100 p-1 rounded-sm"
            >
              <FaEllipsisH />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-32">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Edit Comment
                </button>
                <button
                  onClick={handleDeleteComment}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete Comment
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comment body */}
      <div className="mb-2">
        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 mr-2 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-3 py-1 text-xs text-white bg-reddit-blue rounded-md hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-900">{comment.body}</div>
        )}
      </div>

      {/* Comment actions */}
      <div className="flex items-center text-xs text-gray-500 mb-2">
        <div className="flex items-center mr-3">
          <button
            onClick={() => handleVote(1)}
            className="text-gray-400 hover:text-reddit-orange"
            aria-label="Upvote"
          >
            <FaArrowUp />
          </button>
          <span className="mx-1 font-semibold">{comment.vote_count}</span>
          <button
            onClick={() => handleVote(-1)}
            className="text-gray-400 hover:text-blue-600"
            aria-label="Downvote"
          >
            <FaArrowDown />
          </button>
        </div>

        <button
          onClick={() => setIsReplying(!isReplying)}
          className="flex items-center hover:bg-gray-100 p-1 rounded-sm mr-3"
        >
          <FaReply className="mr-1" />
          <span>Reply</span>
        </button>
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="mb-3">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="What are your thoughts?"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setIsReplying(false)}
              className="px-3 py-1 mr-2 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleReplySubmit}
              className="px-3 py-1 text-xs text-white bg-reddit-blue rounded-md hover:bg-blue-600"
              disabled={!replyBody.trim()}
            >
              Reply
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
