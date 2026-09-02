import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { login } from "../../services/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await login({
        email: email.trim(),
        password,
      });

      navigate("/projects");
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to sign in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT — BRAND / VISUAL */}
        <div className="relative hidden overflow-hidden lg:flex">
          {/* Background glow */}
          <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] -top-32 -left-32" />
          <div className="absolute w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[120px] bottom-0 right-0" />

          <div className="relative z-10 flex flex-col justify-between w-full p-12">

            {/* Logo */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center font-bold text-white bg-purple-600 w-11 h-11 rounded-xl">
                  <img src="../../assets/Images/nebula-logo.png" alt="" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Nebula AI
                  </h2>

                  <p className="text-xs text-zinc-500">
                    Studio
                  </p>
                </div>
              </div>
            </div>

            {/* Main message */}
            <div className="max-w-lg">
              <p className="mb-5 text-sm font-medium text-purple-400">
                YOUR CREATIVE WORKSPACE
              </p>

              <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">
                Create without
                <span className="block text-purple-400">
                  limits.
                </span>
              </h1>

              <p className="max-w-md mt-6 text-base leading-7 text-zinc-500">
                Generate images, videos, characters and stories
                from one powerful creative workspace.
              </p>
            </div>

            {/* Bottom */}
            <p className="text-xs text-zinc-700">
              © {new Date().getFullYear()} Nebula AI Studio
            </p>
          </div>
        </div>

        {/* RIGHT — LOGIN */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-12 lg:hidden">
              <div className="flex items-center justify-center w-10 h-10 font-bold text-white bg-purple-600 rounded-xl">
                Nb.
              </div>

              <div>
                <h2 className="font-semibold">
                  Nebula AI
                </h2>

                <p className="text-xs text-zinc-500">
                  Studio
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Sign in to continue to your creative workspace.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 mb-6 text-sm text-red-400 border rounded-xl border-red-500/20 bg-red-500/10">
                {error}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-300">
                  Email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-12 px-4 text-sm text-white transition border outline-none rounded-xl border-zinc-800 bg-zinc-900/60 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs text-purple-400 transition hover:text-purple-300"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full h-12 px-4 pr-12 text-sm text-white transition border outline-none rounded-xl border-zinc-800 bg-zinc-900/60 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="absolute flex items-center justify-center w-10 h-10 -translate-y-1/2 right-1 top-1/2 text-zinc-500 hover:text-white"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full h-12 gap-2 text-sm font-semibold text-white transition bg-purple-600 rounded-xl hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Register */}
            <p className="mt-8 text-sm text-center text-zinc-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-purple-400 transition hover:text-purple-300"
              >
                Create an account
              </Link>
            </p>

            {/* Terms */}
            <p className="mt-8 text-xs leading-5 text-center text-zinc-700">
              By continuing, you agree to Nebula AI Studio's
              Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}