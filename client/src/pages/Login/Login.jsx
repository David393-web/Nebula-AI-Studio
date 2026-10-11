import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuthStore } from "@/stores/auth/authStore";
import { resolveLoginDestination } from "@/router/authRouting";
import { getLoginErrorMessage } from "@/utils/authError";

const inputClass = "h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    try {
      setLoading(true);
      const user = await signIn({ email: email.trim(), password });
      navigate(resolveLoginDestination(user, location.state?.from?.pathname), { replace: true });
    } catch (err) {
      console.warn("Login request failed", { status: err.response?.status || null, code: err.code || "UNKNOWN" });
      if (err.response?.status === 403) { navigate("/verify-email", { state: { email: email.trim().toLowerCase() } }); return; }
      setError(getLoginErrorMessage(err));
    } finally { setLoading(false); }
  }

  return <AuthLayout>
    <div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-zinc-500">Sign in to continue to your creative workspace.</p></div>
    {location.state?.verified && <p role="status" className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">Email verified. Sign in to continue.</p>}
    {error && <p role="alert" className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-zinc-300">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required className={`mt-2 ${inputClass}`} /></label>
      <div><div className="mb-2 flex items-center justify-between"><label htmlFor="login-password" className="text-sm font-medium text-zinc-300">Password</label><Link to="/forgot-password" className="text-xs text-purple-400 transition hover:text-purple-300">Forgot password?</Link></div>
        <div className="relative"><input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required className={`${inputClass} pr-12`} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-zinc-500 transition hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
      </div>
      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Signing in…" : <>Sign in <ArrowRight size={17}/></>}</button>
    </form>
    <p className="mt-8 text-center text-sm text-zinc-500">Don't have an account? <Link to="/register" className="font-medium text-purple-400 transition hover:text-purple-300">Create an account</Link></p>
    <p className="mt-8 text-center text-xs leading-5 text-zinc-700">By continuing, you agree to Nebula AI Studio's Terms of Service and Privacy Policy.</p>
  </AuthLayout>;
}
