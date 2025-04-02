import { Tab } from "@headlessui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaImage, FaLink, FaPoll, FaRegFileAlt } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createPost } from "../store/slices/postsSlice";
import { fetchSubreddits } from "../store/slices/subredditsSlice";

import Navbar from "../components/Navbar";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Submit = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { items: subreddits, loading: loadingSubreddits } = useAppSelector(
    (state) => state.subreddits
  );

  // Pre-select subreddit from query parameter if provided
  const preSelectedSubreddit = router.query.subreddit as string;

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [subredditId, setSubredditId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab categories
  const categories = [
    { name: "Post", icon: <FaRegFileAlt /> },
    { name: "Link", icon: <FaLink /> },
    { name: "Image & Video", icon: <FaImage /> },
    { name: "Poll", icon: <FaPoll /> },
  ];

  // Active tab state
  const [selectedCategory, setSelectedCategory] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/submit");
    }
  }, [isAuthenticated, router]);

  // Fetch subreddits when component mounts
  useEffect(() => {
    dispatch(fetchSubreddits());
  }, [dispatch]);

  // Find the pre-selected subreddit ID when subreddits are loaded
  useEffect(() => {
    if (preSelectedSubreddit && subreddits.length > 0) {
      const found = subreddits.find((sub) => sub.name === preSelectedSubreddit);
      if (found) {
        setSubredditId(found.id);
      }
    }
  }, [preSelectedSubreddit, subreddits]);

  const getPostTypeFromCategory = (categoryIndex: number): string => {
    switch (categoryIndex) {
      case 0:
        return "text";
      case 1:
        return "link";
      case 2:
        return "image";
      case 3:
        return "poll";
      default:
        return "text";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (subredditId === "") {
      setError("Please select a community");
      return;
    }

    // Validate based on post type
    const postType = getPostTypeFromCategory(selectedCategory);

    if (postType === "link" && !url.trim()) {
      setError("URL is required for Link posts");
      return;
    }

    if (postType === "image" && !url.trim()) {
      setError("Image URL is required for Image posts");
      return;
    }

    if (postType === "poll") {
      setError("Polls are not yet supported");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await dispatch(
        createPost({
          title,
          body: postType === "text" ? body : undefined,
          url: ["link", "image"].includes(postType) ? url : undefined,
          post_type: postType,
          subreddit_id: subredditId as number,
        })
      ).unwrap();

      // Redirect to the created post
      router.push(`/posts/${result.id}`);
    } catch (error) {
      if (typeof error === "string") {
        setError(error);
      } else {
        setError("Failed to create post. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Head>
        <title>Create Post - Reddit Clone</title>
        <meta name="description" content="Create a new post on Reddit Clone" />
      </Head>

      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold mb-4">Create a post</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Subreddit selector */}
          <div className="mb-4">
            <label
              htmlFor="subreddit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Choose a community
            </label>
            <select
              id="subreddit"
              value={subredditId}
              onChange={(e) =>
                setSubredditId(e.target.value ? parseInt(e.target.value) : "")
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select a community</option>
              {loadingSubreddits ? (
                <option disabled>Loading communities...</option>
              ) : (
                subreddits.map((subreddit) => (
                  <option key={subreddit.id} value={subreddit.id}>
                    r/{subreddit.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Post type tabs */}
          <div className="bg-white rounded-md shadow mb-4">
            <Tab.Group
              selectedIndex={selectedCategory}
              onChange={setSelectedCategory}
            >
              <Tab.List className="flex p-1 space-x-1 border-b">
                {categories.map((category) => (
                  <Tab
                    key={category.name}
                    className={({ selected }) =>
                      classNames(
                        "w-full py-2.5 text-sm font-medium flex items-center justify-center",
                        "focus:outline-none",
                        selected
                          ? "text-reddit-blue border-b-2 border-reddit-blue"
                          : "text-gray-500 hover:text-gray-700"
                      )
                    }
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="p-4">
                {/* Text Post */}
                <Tab.Panel>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        maxLength={300}
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {300 - title.length} characters remaining
                      </div>
                    </div>

                    <div className="mb-4">
                      <textarea
                        placeholder="Text (optional)"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-reddit-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isSubmitting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </form>
                </Tab.Panel>

                {/* Link Post */}
                <Tab.Panel>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        maxLength={300}
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {300 - title.length} characters remaining
                      </div>
                    </div>

                    <div className="mb-4">
                      <input
                        type="url"
                        placeholder="URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-reddit-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isSubmitting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </form>
                </Tab.Panel>

                {/* Image Post */}
                <Tab.Panel>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        maxLength={300}
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {300 - title.length} characters remaining
                      </div>
                    </div>

                    <div className="mb-4">
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        For this demo, please provide an image URL. In a
                        production app, you would have an image upload feature.
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-reddit-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isSubmitting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </form>
                </Tab.Panel>

                {/* Poll Post */}
                <Tab.Panel>
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Poll creation is not yet available in this version.
                    </p>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>

          {/* Posting rules */}
          <div className="bg-white rounded-md shadow p-4">
            <h2 className="font-medium text-gray-900 mb-3">
              Posting to Reddit Clone
            </h2>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>1. Remember the human</li>
              <li>2. Behave like you would in real life</li>
              <li>3. Look for the original source of content</li>
              <li>4. Search for duplicates before posting</li>
              <li>5. Read the community's rules</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Submit;
