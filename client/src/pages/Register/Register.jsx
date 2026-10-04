import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth/authStore";

export default function Register() {
  const navigate = useNavigate();
  const createAccount = useAuthStore((state) => state.register);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createAccount(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#08080a] px-5 py-10 text-white"><section className="w-full max-w-md">
    <Link to="/" className="mb-10 inline-flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-600 font-bold">Nb.</span><span><b className="block">Nebula AI</b><small className="text-zinc-500">Studio</small></span></Link>
    <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1><p className="mt-2 text-sm text-zinc-500">Start building in your creative workspace.</p>
    {error && <p role="alert" className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}
    <form onSubmit={submit} className="mt-7 space-y-5">
      {[{name:"name",label:"Name",type:"text"},{name:"email",label:"Email address",type:"email"},{name:"password",label:"Password",type:"password"}].map(field => <label key={field.name} className="block text-sm font-medium text-zinc-300">{field.label}<input name={field.name} type={field.type} value={form[field.name]} onChange={update} required minLength={field.name === "password" ? 6 : undefined} autoComplete={field.name === "password" ? "new-password" : field.name} className="mt-2 h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 text-white outline-none focus:border-purple-500" /></label>)}
      <button disabled={loading} className="h-12 w-full rounded-xl bg-purple-600 text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">{loading ? "Creating account…" : "Create account"}</button>
    </form><p className="mt-7 text-center text-sm text-zinc-500">Already have an account? <Link className="text-purple-400 hover:text-purple-300" to="/login">Sign in</Link></p>
  </section></main>;
}
