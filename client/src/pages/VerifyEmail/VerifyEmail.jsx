import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resendVerification, verifyEmail } from "@/services/auth";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || new URLSearchParams(location.search).get("email") || "");
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil(((location.state?.cooldownUntil || 0) - Date.now()) / 1000)));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.fromRegistration ? "We cannot confirm inbox delivery here. Check your inbox and spam folder; if no code arrived, request another once the timer ends." : "");

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await verifyEmail({ email: email.trim(), code });
      navigate("/login", { replace: true, state: { verified: true } });
    } catch (err) {
      setError(err.response?.data?.message || "We could not verify that code. Request a new one and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email.trim() || remaining > 0 || resending) return;
    setError("");
    setNotice("");
    setResending(true);
    try {
      const response = await resendVerification(email.trim());
      setNotice(response?.message || "If the address is eligible, a code may be sent. Check your inbox shortly.");
      setRemaining(60);
      setCode("");
    } catch (err) {
      setError(err.response?.data?.message || "We could not process that request. Please wait a moment and try again.");
      if (err.response?.status === 429) setRemaining(Number(err.response.headers?.["retry-after"]) || 60);
    } finally {
      setResending(false);
    }
  }

  return <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#08080a] px-5 py-10 text-white">
    <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-700/15 blur-[100px]"/><div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-fuchsia-700/10 blur-[110px]"/>
    <section className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl shadow-black/40 sm:p-8">
      <Link to="/login" className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-white"><ArrowLeft size={14}/> Back to sign in</Link>
      <div className="mt-8 grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300"><ShieldCheck size={22}/></div>
      <p className="mt-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-violet-300"><Sparkles size={13}/> Nebula AI Studio</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Verify your email</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-400">Enter the six-digit code sent to your email address. Codes expire after 10 minutes.</p>

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-sm leading-5 text-violet-200">{notice}</p>}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-xs font-medium text-zinc-400">Email address<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"/></label>
        <label className="block text-xs font-medium text-zinc-400">Verification code<input type="text" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" aria-label="Six-digit verification code" className="mt-2 h-14 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-center font-mono text-2xl tracking-[.6em] text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"/></label>
        <button type="submit" disabled={loading || code.length !== 6 || !email.trim()} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={16} className="animate-spin"/> Verifying…</> : <><CheckCircle2 size={16}/> Verify email</>}</button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 border-t border-zinc-800 pt-5 text-center">
        <p className="text-xs text-zinc-500">Didn’t receive a code? Check your spam folder.</p>
        <button type="button" onClick={resend} disabled={!email.trim() || resending || remaining > 0} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/10 hover:text-white disabled:cursor-not-allowed disabled:text-zinc-600">{resending ? <><LoaderCircle size={14} className="animate-spin"/> Requesting…</> : <><Mail size={14}/>{remaining > 0 ? `Resend code in ${remaining}s` : "Resend verification code"}</>}</button>
      </div>
      <p className="mt-5 text-center text-[11px] leading-5 text-zinc-600">Verification codes are single-use and limited to protect your account.</p>
    </section>
  </main>;
}
