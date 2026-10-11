import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { resetPassword } from "@/services/auth";
import { extractResetToken, resetUrlWithoutToken } from "./resetLink";

const inputClass = "mt-2 h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20";

export default function ResetPassword() {
  const navigate = useNavigate();
  // Capture before any effect scrubs the URL. This also survives StrictMode's
  // development-only effect replay, which would otherwise read an empty URL.
  const [token] = useState(() => extractResetToken(window.location));
  const [checkingLink, setCheckingLink] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (window.location.search || window.location.hash) {
      window.history.replaceState(window.history.state, "", resetUrlWithoutToken(window.location));
    }
    setCheckingLink(false);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) { setError("The passwords do not match."); return; }
    console.info("Password reset client stage", { requestStage: "api_submission", tokenPresent: Boolean(token) });
    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      console.info("Password reset client stage", { requestStage: "api_success" });
      setSuccess(true);
      setPassword("");
      setConfirmation("");
    } catch (err) {
      console.warn("Password reset client stage", { requestStage: "api_failure", status: Number.isInteger(err.response?.status) ? err.response.status : null, errorCode: /^[A-Z0-9_.-]{1,80}$/.test(err.response?.data?.code || "") ? err.response.data.code : "RESET_REQUEST_FAILED" });
      setError(err.response?.data?.message || "That reset link is invalid or expired. Request a new one and try again.");
    } finally { setLoading(false); }
  }

  return <AuthLayout>
    <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-white"><ArrowLeft size={14}/> Back to sign in</Link>
    <div className="mb-8"><div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-purple-300"><LockKeyhole size={21}/></div><p className="text-xs font-medium uppercase tracking-[.18em] text-purple-300">Secure account recovery</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose a new password</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Your reset link is single-use and expires after 30 minutes.</p></div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
    {checkingLink ? <p role="status" className="flex items-center gap-2 text-sm text-zinc-400"><LoaderCircle size={16} className="animate-spin"/> Checking reset link…</p> : success ? <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">Your password has been updated. Sign in using your new password.</div> : !token ? <div role="alert" className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">This reset link is missing or invalid. Request a new password reset link to continue.</div> : <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm font-medium text-zinc-300">New password<div className="relative"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 to 72 characters" autoComplete="new-password" minLength={6} maxLength={72} required className={`${inputClass} pr-12`}/><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-zinc-500 transition hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
      <label className="block text-sm font-medium text-zinc-300">Confirm new password<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Enter the new password again" autoComplete="new-password" minLength={6} maxLength={72} required className={inputClass}/></label>
      <button type="submit" disabled={loading || password.length < 6 || confirmation.length < 6} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={16} className="animate-spin"/> Updating…</> : "Update password"}</button>
    </form>}
    <p className="mt-8 text-center text-sm text-zinc-500">Need a new link? <button type="button" onClick={() => navigate("/forgot-password")} className="font-medium text-purple-400 hover:text-purple-300">Request another</button></p>
  </AuthLayout>;
}
