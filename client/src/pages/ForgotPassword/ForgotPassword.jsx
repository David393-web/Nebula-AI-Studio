import { useState } from "react";
import { ArrowLeft, LoaderCircle, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { requestPasswordReset } from "@/services/auth";

const inputClass = "mt-2 h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "We could not process that request. Please wait a moment and try again.");
    } finally { setLoading(false); }
  }

  return <AuthLayout>
    <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-white"><ArrowLeft size={14}/> Back to sign in</Link>
    <div className="mb-8"><div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-purple-300"><Mail size={21}/></div><p className="text-xs font-medium uppercase tracking-[.18em] text-purple-300">Account recovery</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Forgot your password?</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Enter the email address on your account. We’ll send a one-time reset link if an account matches.</p></div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
    {submitted ? <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">If an account exists for that address, password reset instructions may be sent. Check your inbox and spam folder. This message does not confirm delivery.</div> : <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm font-medium text-zinc-300">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" maxLength={254} required className={inputClass}/></label>
      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={16} className="animate-spin"/> Sending…</> : <>Send reset link <Send size={16}/></>}</button>
    </form>}
    <p className="mt-8 text-center text-sm text-zinc-500">Remembered your password? <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300">Sign in</Link></p>
  </AuthLayout>;
}
