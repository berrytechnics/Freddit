// frontend/src/pages/signup.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearError, registerUser } from "../store/slices/authSlice";

const Signup = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Already authenticated, redirecting...");
      return;
      const redirectTo = (router.query.redirect as string) || "/";
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

    // Clear the error for this field
    if (formErrors[e.target.name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: undefined,
      });
    }
  };

  const validateForm = () => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      errors.username = "Username must be between 3 and 20 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username =
        "Username can only contain letters, numbers, underscores, and hyphens";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Register user
    dispatch(
      registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })
    );
  };

  // Safely handle the error message display
  const errorMessage = error
    ? typeof error === "string"
      ? error
      : (error as any)?.message || "An unknown error occurred"
    : null;

  return (
    <>
      <Head>
        <title>Sign Up - Freddit</title>
        <meta name="description" content="Create a new account on Freddit" />
      </Head>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Form fields remain the same */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.username ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                />
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.username}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.email ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.email}
                  </p>
                )}
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
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.password ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
