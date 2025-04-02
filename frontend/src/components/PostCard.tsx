import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBookmark,
  FaEllipsisH,
  FaRegCommentAlt,
  FaShare,
} from "react-icons/fa";
import { Post } from "../lib/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { deletePost, votePost } from "../store/slices/postsSlice";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnPost = user?.id === post.user.id;

  const handleVote = (voteValue: 1 | 0 | -1) => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    dispatch(votePost({ id: post.id, vote: voteValue }));
  };

  const handleDeletePost = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      dispatch(deletePost(post.id));
    }
    setShowMenu(false);
  };

  const handleEditPost = () => {
    router.push(`/posts/${post.id}/edit`);
    setShowMenu(false);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Format the post creation date
  const formattedDate = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : "recently";

  return (
    <div className="bg-white rounded-md shadow border border-gray-300 hover:border-gray-400">
      {/* Vote Column */}
      <div className="flex">
        <div className="w-10 bg-gray-50 flex flex-col items-center py-2 rounded-l-md">
          <button
            onClick={() => handleVote(1)}
            className="text-gray-400 hover:text-reddit-orange focus:outline-none"
            aria-label="Upvote"
          >
            <FaArrowUp />
          </button>
          <span className="text-xs font-bold my-1">{post.vote_count}</span>
          <button
            onClick={() => handleVote(-1)}
            className="text-gray-400 hover:text-blue-600 focus:outline-none"
            aria-label="Downvote"
          >
            <FaArrowDown />
          </button>
        </div>

        {/* Content Column */}
        <div className="p-2 w-full">
          {/* Post Metadata */}
          <div className="flex text-xs text-gray-500 mb-2">
            <Link
              href={`/r/${post.subreddit.name}`}
              className="font-bold hover:underline mr-1"
            >
              r/{post.subreddit.name}
            </Link>
            <span className="mx-1">•</span>
            <span>Posted by </span>
            <Link
              href={`/u/${post.user.username}`}
              className="hover:underline ml-1 mr-1"
            >
              u/{post.user.username}
            </Link>
            <span className="mx-1">•</span>
            <span>{formattedDate}</span>
          </div>

          {/* Post Title */}
          <Link href={`/posts/${post.id}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {post.title}
            </h2>
          </Link>

          {/* Post Body - truncated for card view */}
          {post.body && (
            <div className="text-sm text-gray-800 mb-3 line-clamp-3">
              {post.body}
            </div>
          )}

          {/* Link Post */}
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline block mb-3"
            >
              {post.url}
            </a>
          )}

          {/* Post Actions */}
          <div className="flex items-center text-xs text-gray-500">
            <Link
              href={`/posts/${post.id}`}
              className="flex items-center hover:bg-gray-100 p-1 rounded-sm"
            >
              <FaRegCommentAlt className="mr-1" />
              <span>{post.comment_count} Comments</span>
            </Link>

            <button
              className="flex items-center hover:bg-gray-100 p-1 rounded-sm ml-2"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/posts/${post.id}`
                );
                alert("Link copied to clipboard!");
              }}
            >
              <FaShare className="mr-1" />
              <span>Share</span>
            </button>

            <button className="flex items-center hover:bg-gray-100 p-1 rounded-sm ml-2">
              <FaBookmark className="mr-1" />
              <span>Save</span>
            </button>

            {isOwnPost && (
              <div className="relative ml-auto">
                <button
                  onClick={toggleMenu}
                  className="flex items-center hover:bg-gray-100 p-1 rounded-sm"
                >
                  <FaEllipsisH />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-32">
                    <button
                      onClick={handleEditPost}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Edit Post
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
