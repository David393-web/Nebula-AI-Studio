import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return <main className="grid min-h-screen place-items-center bg-[#08080a] px-5 text-white"><section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-7"><p className="text-sm font-medium text-violet-300">Account recovery</p><h1 className="mt-2 text-2xl font-semibold">Password reset</h1><p className="mt-4 text-sm leading-6 text-zinc-400">Email based password recovery is not configured for this deployment. If you are signed in on another device, change your password in Settings. Otherwise contact the workspace administrator to recover your account.</p><Link to="/login" className="mt-6 inline-flex rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium hover:bg-violet-500">Return to sign in</Link></section></main>;
}
