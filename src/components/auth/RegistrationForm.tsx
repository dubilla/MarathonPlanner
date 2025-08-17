"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function RegistrationForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Check if database is configured
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!email || !password || !confirmPassword) {
      setMessage("All fields are required.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      console.log("[REGISTRATION FORM] Attempting signup with:", {
        email,
        hasPassword: !!password,
        action: "signup"
      });

      const result = await signIn("credentials", {
        email,
        password,
        action: "signup",
        redirect: false,
      });

      console.log("[REGISTRATION FORM] SignIn result:", {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url
      });

      if (result?.error) {
        console.log("[REGISTRATION FORM] Error during signup:", result.error);
        if (result.error.includes("User already exists")) {
          setMessage("An account with this email already exists. Try signing in instead.");
        } else {
          setMessage("Error creating account. Please try again.");
        }
      } else if (result?.ok) {
        console.log("[REGISTRATION FORM] Signup successful, redirecting...");
        setMessage("Account created successfully! Redirecting...");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("[REGISTRATION FORM] Exception during signup:", error);
      setMessage("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        Marathon Training Planner
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address
          </label>
          <input
            id="email"
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
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your password"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes("Error") || message.includes("do not match") || message.includes("already exists") || message.includes("required") || message.includes("must be")
            ? "bg-red-50 border border-red-200"
            : "bg-blue-50 border border-blue-200"
        }`}>
          <p className={`text-sm ${
            message.includes("Error") || message.includes("do not match") || message.includes("already exists") || message.includes("required") || message.includes("must be")
              ? "text-red-800"
              : "text-blue-800"
          }`}>
            {message}
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/sessions/create" className="text-blue-600 hover:text-blue-500">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}