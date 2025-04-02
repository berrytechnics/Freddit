import Link from "next/link";
import { useEffect } from "react";
import { FaReddit } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchSubreddits } from "../store/slices/subredditsSlice";

interface SidebarProps {
  subredditName?: string;
}

const Sidebar = ({ subredditName }: SidebarProps) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { items: subreddits, loading } = useAppSelector(
    (state) => state.subreddits
  );

  useEffect(() => {
    // If we're not on a subreddit page, fetch top subreddits
    if (!subredditName) {
      dispatch(fetchSubreddits({ sort: "subscribers", limit: 5 }));
    }
  }, [dispatch, subredditName]);

  return (
    <div className="space-y-4">
      {/* About Community section - only on subreddit pages */}
      {subredditName && (
        <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
          <div className="bg-reddit-blue p-3 text-white">
            <h2 className="font-semibold">About Community</h2>
          </div>
          <div className="p-3">
            <p className="text-sm text-gray-800 mb-3">
              {/* This would be dynamically populated with the subreddit description */}
              Welcome to r/{subredditName}, a community for discussions and
              content related to this topic.
            </p>

            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">Members</div>
              <div className="text-base font-semibold">3.2k</div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">Created</div>
              <div className="text-sm">Jan 1, 2023</div>
            </div>

            {isAuthenticated && (
              <button className="w-full py-1 bg-reddit-blue text-white rounded-md text-sm font-medium">
                Join
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Post card */}
      <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
        <div className="p-3">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-md bg-reddit-orange text-white flex items-center justify-center">
              <FaReddit size={24} />
            </div>
            <div className="ml-2">
              <h2 className="font-semibold">Home</h2>
            </div>
          </div>

          <p className="text-sm text-gray-800 mb-3">
            Your personal Reddit frontpage. Come here to check in with your
            favorite communities.
          </p>

          <Link
            href="/submit"
            className="block w-full py-1 bg-reddit-orange text-white rounded-md text-sm font-medium text-center"
          >
            Create Post
          </Link>

          {isAuthenticated && (
            <Link
              href="/subreddits/create"
              className="block w-full py-1 mt-2 border border-reddit-blue text-reddit-blue rounded-md text-sm font-medium text-center"
            >
              Create Community
            </Link>
          )}
        </div>
      </div>

      {/* Top Communities section - only on home and non-subreddit pages */}
      {!subredditName && (
        <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
          <div className="bg-reddit-blue p-3 text-white">
            <h2 className="font-semibold">Top Communities</h2>
          </div>

          <div>
            {loading ? (
              <div className="p-3 text-sm text-gray-500">
                Loading communities...
              </div>
            ) : (
              <ul>
                {subreddits.map((subreddit, index) => (
                  <li key={subreddit.id}>
                    <Link
                      href={`/r/${subreddit.name}`}
                      className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-200"
                    >
                      <span className="text-sm font-medium text-gray-500 mr-3">
                        {index + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-reddit-blue flex items-center justify-center text-white">
                        <FaReddit />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium">
                          r/{subreddit.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {subreddit.subscribers_count || 0} members
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/subreddits"
              className="block p-3 text-sm text-blue-500 hover:bg-gray-50 text-center"
            >
              View All Communities
            </Link>
          </div>
        </div>
      )}

      {/* Reddit policies - footer section */}
      <div className="text-xs text-gray-500">
        <div className="flex flex-wrap gap-2 mb-2">
          <Link href="/help" className="hover:underline">
            Help
          </Link>
          <Link href="/tos" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </div>
        <p>© 2025 Reddit Clone</p>
      </div>
    </div>
  );
};

export default Sidebar;
