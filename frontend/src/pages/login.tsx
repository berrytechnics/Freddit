import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FaReddit } from 'react-icons/fa';
import Input from '../components/Input';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearError, loginUser } from '../store/slices/authSlice';

const Login = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector(
    state => state.auth
  );

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = (router.query.redirect as string) || '/feed';
      router.push(redirectTo);
    }

    // Clear any previous auth errors when component mounts
    dispatch(clearError());
  }, [isAuthenticated, router, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <>
      <Head>
        <title>Log In - Reddit Clone</title>
        <meta name="description" content="Log in to Reddit Clone" />
      </Head>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              <FaReddit className="text-reddit-orange text-4xl" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
              Log in to Reddit Clone
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              By continuing, you agree to our User Agreement and Privacy Policy.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="mt-1">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-reddit-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-reddit-orange disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New to Reddit Clone?{' '}
              <Link
                href="/signup"
                className="font-medium text-reddit-blue hover:text-blue-500"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Return to home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
