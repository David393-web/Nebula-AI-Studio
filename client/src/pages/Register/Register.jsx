import { useState } from "react";
import { Eye, EyeOff, ArrowRight, LoaderCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuthStore } from "@/stores/auth/authStore";

const inputClass = "mt-2 h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20";

export default function Register() {
  const navigate = useNavigate();
  const createAccount = useAuthStore((state) => state.register);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createAccount(form);
      navigate("/verify-email", { replace: true, state: { email: form.email.trim().toLowerCase(), cooldownUntil: Date.now() + 60_000, fromRegistration: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create your account. Please try again.");
    } finally { setLoading(false); }
  }

  return <AuthLayout>
    <div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight">Create your account</h1><p className="mt-2 text-sm text-zinc-500">Start building in your creative workspace.</p></div>
    {error && <p role="alert" className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm font-medium text-zinc-300">Name<input name="name" type="text" value={form.name} onChange={update} maxLength={100} autoComplete="name" placeholder="Your name" className={inputClass}/></label>
      <label className="block text-sm font-medium text-zinc-300">Email address<input name="email" type="email" value={form.email} onChange={update} required maxLength={254} autoComplete="email" placeholder="you@example.com" className={inputClass}/></label>
      <div><label htmlFor="register-password" className="block text-sm font-medium text-zinc-300">Password</label><div className="relative"><input id="register-password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={update} required minLength={6} autoComplete="new-password" placeholder="At least 6 characters" className={`${inputClass} pr-12`}/><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-zinc-500 transition hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div><p className="mt-2 text-xs text-zinc-600">Use at least 6 characters.</p></div>
      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={16} className="animate-spin"/>Creating account…</> : <>Create account <ArrowRight size={17}/></>}</button>
    </form>
    <p className="mt-8 text-center text-sm text-zinc-500">Already have an account? <Link to="/login" className="font-medium text-purple-400 transition hover:text-purple-300">Sign in</Link></p>
    <p className="mt-8 text-center text-xs leading-5 text-zinc-700">By creating an account, you agree to Nebula AI Studio's Terms of Service and Privacy Policy.</p>
  </AuthLayout>;
}
