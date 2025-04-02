import { formatDistanceToNow } from "date-fns";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearComments } from "../../store/slices/commentsSlice";
import { fetchPostById, votePost } from "../../store/slices/postsSlice";

import CommentSection from "../../components/CommentSection";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

const PostDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const postId = parseInt(id as string);

  const dispatch = useAppDispatch();
  const { currentPost, loading, error } = useAppSelector(
    (state) => state.posts
  );
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Make sure we have a valid post ID before fetching
    if (!isNaN(postId)) {
      dispatch(fetchPostById(postId));
    }

    // Clean up comments when unmounting
    return () => {
      dispatch(clearComments());
    };
  }, [dispatch, postId]);

  // Handle post voting
  const handleVote = (voteValue: 1 | 0 | -1) => {
    if (!user) {
      router.push("/login");
      return;
    }

    dispatch(votePost({ id: postId, vote: voteValue }));
  };

  // Format the post creation date
  const formattedDate = currentPost?.created_at
    ? formatDistanceToNow(new Date(currentPost.created_at), { addSuffix: true })
    : "";

  return (
    <>
      <Head>
        <title>
          {currentPost
            ? `${currentPost.title} - Reddit Clone`
            : "Loading... - Reddit Clone"}
        </title>
        <meta
          name="description"
          content={currentPost?.body?.slice(0, 160) || "Post details"}
        />
      </Head>

      <Navbar />

      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <FaArrowLeft className="mr-2" />
            <span>Back</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Main content */}
          <div className="w-full md:w-2/3">
            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-md shadow">
                <p className="text-gray-500">Loading post...</p>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : !currentPost ? (
              <div className="bg-white rounded-md shadow p-6 text-center">
                <h1 className="text-xl font-semibold text-gray-700 mb-4">
                  Post not found
                </h1>
                <p className="text-gray-500 mb-4">
                  The post you're looking for may have been deleted or doesn't
                  exist.
                </p>
                <Link
                  href="/"
                  className="inline-block px-4 py-2 bg-reddit-blue text-white rounded-md"
                >
                  Go to Homepage
                </Link>
              </div>
            ) : (
              <>
                {/* Post detail card */}
                <div className="bg-white rounded-md shadow mb-6">
                  <div className="flex">
                    {/* Vote column */}
                    <div className="w-10 bg-gray-50 flex flex-col items-center py-2 rounded-l-md">
                      <button
                        onClick={() => handleVote(1)}
                        className="text-gray-400 hover:text-reddit-orange focus:outline-none"
                        aria-label="Upvote"
                      >
                        <FaArrowLeft className="transform rotate-90" />
                      </button>
                      <span className="text-xs font-bold my-1">
                        {currentPost.vote_count}
                      </span>
                      <button
                        onClick={() => handleVote(-1)}
                        className="text-gray-400 hover:text-blue-600 focus:outline-none"
                        aria-label="Downvote"
                      >
                        <FaArrowLeft className="transform -rotate-90" />
                      </button>
                    </div>

                    {/* Post content */}
                    <div className="p-4 w-full">
                      {/* Post metadata */}
                      <div className="flex text-xs text-gray-500 mb-2">
                        <Link
                          href={`/r/${currentPost.subreddit.name}`}
                          className="font-bold hover:underline mr-1"
                        >
                          r/{currentPost.subreddit.name}
                        </Link>
                        <span className="mx-1">•</span>
                        <span>Posted by </span>
                        <Link
                          href={`/u/${currentPost.user.username}`}
                          className="hover:underline ml-1 mr-1"
                        >
                          u/{currentPost.user.username}
                        </Link>
                        <span className="mx-1">•</span>
                        <span>{formattedDate}</span>
                      </div>

                      {/* Post title */}
                      <h1 className="text-xl font-semibold text-gray-900 mb-3">
                        {currentPost.title}
                      </h1>

                      {/* Post body */}
                      {currentPost.body && (
                        <div className="text-gray-800 mb-4 whitespace-pre-line">
                          {currentPost.body}
                        </div>
                      )}

                      {/* Post link */}
                      {currentPost.url && (
                        <a
                          href={currentPost.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline block mb-4"
                        >
                          {currentPost.url}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments section */}
                <CommentSection postId={currentPost.id} />
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-1/3 mt-6 md:mt-0">
            {currentPost && (
              <Sidebar subredditName={currentPost.subreddit.name} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostDetail;
