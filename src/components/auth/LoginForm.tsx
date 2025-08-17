"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [authMode, setAuthMode] = useState<"password" | "magic-link">("password");

  const isDatabaseConfigured = process.env.NEXT_PUBLIC_DB_CONFIGURED;

  if (!isDatabaseConfigured) {
    return (
      <div className="max-w-md mx-auto bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">
          Marathon Training Planner
        </h2>
        <div className="text-center">
          <p className="text-yellow-800 mb-4">
            Database configuration required to use authentication.
          </p>
          <p className="text-sm text-yellow-700">
            Please set up your environment variables. See README.md for
            instructions.
          </p>
        </div>
      </div>
    );
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
      });

      if (result?.error) {
        setMessage("Error sending email. Please try again.");
      } else {
        setMessage("Check your email for the sign-in link!");
      }
    } catch {
      setMessage("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!email || !password) {
      setMessage("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      console.log("[LOGIN FORM] Attempting signin with:", {
        email,
        hasPassword: !!password,
        action: "signin"
      });

      const result = await signIn("credentials", {
        email,
        password,
        action: "signin",
        redirect: false,
      });

      console.log("[LOGIN FORM] SignIn result:", {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url
      });

      if (result?.error) {
        console.log("[LOGIN FORM] Error during signin:", result.error);
        setMessage("Invalid email or password.");
      } else if (result?.ok) {
        console.log("[LOGIN FORM] Signin successful, redirecting...");
        setMessage("Signed in successfully! Redirecting...");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("[LOGIN FORM] Exception during signin:", error);
      setMessage("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        Marathon Training Planner
      </h2>

      <div className="mb-6">
        <div className="flex rounded-lg border border-gray-300 p-1">
          <button
            type="button"
            onClick={() => setAuthMode("password")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              authMode === "password"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("magic-link")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              authMode === "magic-link"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Magic Link
          </button>
        </div>
      </div>

      {authMode === "magic-link" ? (
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="email-magic"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email-magic"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="your.email@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Sign-In Link"}
          </button>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              We&apos;ll send you a secure link to sign in without a password.
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="email-password"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email-password"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes("Error") || message.includes("Invalid") || message.includes("required")
            ? "bg-red-50 border border-red-200"
            : "bg-blue-50 border border-blue-200"
        }`}>
          <p className={`text-sm ${
            message.includes("Error") || message.includes("Invalid") || message.includes("required")
              ? "text-red-800"
              : "text-blue-800"
          }`}>
            {message}
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/users/create" className="text-blue-600 hover:text-blue-500">
            Create one here
          </a>
        </p>
      </div>
    </div>
  );
}
