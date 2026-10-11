import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, CreditCard, Image as ImageIcon, LoaderCircle, RefreshCw, Search, ShieldCheck, Sparkles, Users, Video, Wallet, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth/authStore";

const tabs = ["Overview", "Users", "Activity", "Payments"];
const money = (minor, currency = "NGN") => new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format((Number(minor) || 0) / 100);
const dateTime = (value) => value ? new Date(value).toLocaleString() : "—";
const unwrap = (response) => response.data?.data;

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState("Overview");
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [activity, setActivity] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [grantingUser, setGrantingUser] = useState(null);
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [savingGrant, setSavingGrant] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [overviewResponse, usersResponse, activityResponse, paymentsResponse] = await Promise.all([
        api.get("/admin/dashboard?days=30"),
        api.get(`/admin/users?page=${page}&take=25&search=${encodeURIComponent(search)}`),
        api.get("/admin/activity?take=60"),
        api.get("/admin/payments?take=60"),
      ]);
      setSummary(unwrap(overviewResponse));
      const userData = unwrap(usersResponse);
      setUsers(userData?.users || []); setUserCount(userData?.total || 0); setPages(userData?.pages || 1);
      setActivity(unwrap(activityResponse) || []); setPayments(unwrap(paymentsResponse) || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || (requestError.response?.status === 403 ? "This account does not have administrator access." : "Admin data could not be loaded. Check the server connection and try again."));
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const stats = useMemo(() => [
    { label: "Total users", value: summary?.users?.total ?? "—", hint: `+${summary?.users?.newInRange ?? 0} in 30 days`, icon: Users },
    { label: "Generated images", value: summary?.workspace?.images ?? "—", hint: "Across all accounts", icon: ImageIcon },
    { label: "Generated videos", value: summary?.workspace?.videos ?? "—", hint: `${summary?.workspace?.generationsInRange ?? 0} generations in 30 days`, icon: Video },
    { label: "Successful payments", value: summary?.revenue?.successfulPayments ?? "—", hint: `${summary?.revenue?.pendingPayments ?? 0} pending`, icon: CreditCard },
  ], [summary]);

  const openUser = async (row) => {
    setSelectedUser(row); setUserActivity(null);
    try { setUserActivity(unwrap(await api.get(`/admin/users/${encodeURIComponent(row.id)}/activity`))); }
    catch (requestError) { setError(requestError.response?.data?.message || "User activity could not be loaded."); }
  };

  const submitGrant = async (event) => {
    event.preventDefault();
    if (!grantingUser) return;
    setSavingGrant(true); setError(""); setNotice("");
    try {
      const response = await api.post(`/admin/users/${encodeURIComponent(grantingUser.id)}/credits`, { amount: Number(amount), reason });
      setNotice(response.data?.message || "Credits granted.");
      setGrantingUser(null); setReason(""); setAmount(100);
      await loadDashboard();
      if (selectedUser?.id === grantingUser.id) await openUser({ ...grantingUser, creditAccount: { balance: unwrap(response)?.balance } });
    } catch (requestError) { setError(requestError.response?.data?.message || "Credits could not be added."); }
    finally { setSavingGrant(false); }
  };

  const eventIcon = (kind) => ({ credit: Wallet, payment: CreditCard, image: ImageIcon, video: Video, project: Sparkles }[kind] || Activity);

  if (user && user.role !== "ADMIN") return <section className="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 text-center"><ShieldCheck className="mx-auto text-violet-300" size={34}/><h1 className="mt-4 text-2xl font-semibold">Admin access required</h1><p className="mt-2 text-sm text-zinc-400">This workspace is limited to authorized administrators.</p><Link to="/dashboard" className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium">Back to studio</Link></section>;

  return <div className="space-y-7 text-white">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-300"><ShieldCheck size={15}/> Control room</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Admin dashboard</h1><p className="mt-2 max-w-2xl text-sm text-zinc-400">Review account activity, manage user credits, and monitor recorded payments.</p></div>
      <button type="button" onClick={loadDashboard} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200 hover:border-violet-500 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Refresh</button>
    </header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}<button onClick={() => setError("")} aria-label="Dismiss" className="rounded-lg p-1 hover:bg-red-500/10"><X size={16}/></button></div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">{notice}</div>}
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 p-1.5">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === item ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>{item}</button>)}</nav>

    {tab === "Overview" && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, hint, icon: Icon }) => <article key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><div className="flex items-center justify-between"><p className="text-sm text-zinc-400">{label}</p><span className="rounded-xl bg-violet-500/10 p-2 text-violet-300"><Icon size={17}/></span></div><p className="mt-5 text-3xl font-semibold">{loading ? <LoaderCircle size={22} className="animate-spin text-zinc-500"/> : value}</p><p className="mt-1 text-xs text-zinc-500">{hint}</p></article>)}</section>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-zinc-900 p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-violet-200">Successful payment volume</p><p className="mt-1 text-xs text-zinc-500">Recorded gross · {summary?.revenue?.source === "test" ? "test mode, not real revenue" : "live payments"}</p></div><Wallet className="text-violet-300" size={20}/></div><p className="mt-5 text-3xl font-semibold sm:text-4xl">{money(summary?.revenue?.grossAmountMinor, summary?.revenue?.currency)}</p><div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-zinc-400"><span>Last 30 days: <b className="text-white">{money(summary?.revenue?.rangeAmountMinor, summary?.revenue?.currency)}</b></span><span>Transactions: <b className="text-white">{summary?.revenue?.rangePayments ?? 0}</b></span></div></article>
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Latest activity</h2><p className="mt-1 text-xs text-zinc-500">Recent workspace and billing events</p></div><button onClick={() => setTab("Activity")} className="text-xs text-violet-300">View all →</button></div><div className="mt-4 divide-y divide-zinc-800">{activity.slice(0, 6).map((event) => { const Icon = eventIcon(event.type); return <div key={`${event.type}-${event.id}`} className="flex items-center gap-3 py-3"><span className="rounded-lg bg-zinc-800 p-2 text-violet-300"><Icon size={15}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm">{event.user?.name || event.user?.email || "User"} <span className="text-zinc-500">· {event.label}</span></p><p className="mt-1 text-[11px] text-zinc-600">{dateTime(event.createdAt)}</p></div></div>; })}{!activity.length && <p className="py-8 text-center text-sm text-zinc-500">{loading ? "Loading activity…" : "No activity yet."}</p>}</div></article>
      </section>
    </>}

    {tab === "Users" && <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">User accounts</h2><p className="mt-1 text-xs text-zinc-500">{userCount.toLocaleString()} accounts · select a user to review their activity</p></div><form onSubmit={(e) => { e.preventDefault(); setPage(1); loadDashboard(); }} className="flex w-full gap-2 sm:w-auto"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 sm:w-72"><Search size={15} className="shrink-0 text-zinc-500"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-zinc-600"/></label><button className="rounded-xl bg-zinc-800 px-3 text-sm">Search</button></form></div>
      <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-zinc-500"><tr><th className="py-3">User</th><th>Joined</th><th>Balance</th><th>Workspace</th><th>Role</th><th className="text-right">Actions</th></tr></thead><tbody className="divide-y divide-zinc-800">{users.map((row) => <tr key={row.id} className="hover:bg-white/[.02]"><td className="py-3"><button onClick={() => openUser(row)} className="text-left"><span className="block font-medium text-white">{row.name || "Unnamed user"}</span><span className="text-xs text-zinc-500">{row.email}</span></button></td><td className="text-xs text-zinc-400">{dateTime(row.createdAt)}</td><td className="font-medium">{row.creditAccount?.balance ?? 0}</td><td className="text-xs text-zinc-400">{row._count.projects} projects · {row._count.images} images · {row._count.videos} videos</td><td><span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] uppercase text-zinc-300">{row.role}</span></td><td className="text-right"><button onClick={() => setGrantingUser(row)} className="rounded-lg border border-violet-500/30 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/10">Top up</button></td></tr>)}</tbody></table></div>
      <div className="space-y-2 sm:hidden">{users.map((row) => <article key={row.id} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"><div className="flex items-start justify-between gap-3"><button onClick={() => openUser(row)} className="min-w-0 text-left"><span className="block truncate font-medium">{row.name || "Unnamed user"}</span><span className="mt-1 block truncate text-xs text-zinc-500">{row.email}</span></button><span className="shrink-0 rounded-full bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300">{row.role}</span></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-zinc-400">{row.creditAccount?.balance ?? 0} credits</span><span className="text-zinc-500">{row._count.projects} projects · {row._count.images} images · {row._count.videos} videos</span></div><div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-zinc-600">Joined {new Date(row.createdAt).toLocaleDateString()}</span><button onClick={() => setGrantingUser(row)} className="rounded-lg bg-violet-600/15 px-3 py-2 text-xs font-medium text-violet-200">Top up credits</button></div></article>)}</div>
      <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages} onClick={() => setPage((n) => n + 1)} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">Next</button></div></div>
    </section>}

    {tab === "Activity" && <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5"><div className="mb-4"><h2 className="text-lg font-semibold">User activity</h2><p className="mt-1 text-xs text-zinc-500">Creation, credit, and payment events across the workspace</p></div><div className="divide-y divide-zinc-800">{activity.map((event) => { const Icon = eventIcon(event.type); return <article key={`${event.type}-${event.id}`} className="flex items-start gap-3 py-4"><span className="rounded-xl bg-zinc-800 p-2.5 text-violet-300"><Icon size={17}/></span><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{event.label}</p><p className="mt-1 break-all text-xs text-zinc-500">{event.user?.name || "Unnamed user"} · {event.user?.email}</p><p className="mt-1 text-[11px] text-zinc-600">{event.type} · {dateTime(event.createdAt)}</p></div>{event.type === "credit" && <span className={`shrink-0 text-sm ${event.delta > 0 ? "text-emerald-300" : "text-zinc-300"}`}>{event.delta > 0 ? "+" : ""}{event.delta}</span>}{event.type === "payment" && <span className="shrink-0 text-right text-xs text-zinc-300">{money(event.amountMinor, event.currency)}<span className="mt-1 block text-[10px] capitalize text-zinc-500">{event.status}</span></span>}</article>; })}{!activity.length && <p className="py-10 text-center text-sm text-zinc-500">{loading ? "Loading events…" : "No activity recorded yet."}</p>}</div></section>}

    {tab === "Payments" && <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Payments & revenue</h2><p className="mt-1 text-xs text-zinc-500">Successful payments count toward recorded gross. Pending and failed attempts remain visible.</p></div><span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[11px] text-amber-200">Paystack test mode · no real revenue</span></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="Recorded gross" value={money(summary?.revenue?.grossAmountMinor)}/><Metric label="Successful" value={summary?.revenue?.successfulPayments ?? 0}/><Metric label="Pending" value={summary?.revenue?.pendingPayments ?? 0}/></div><div className="mt-5 divide-y divide-zinc-800">{payments.map((payment) => <article key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{payment.user?.name || payment.user?.email || "User"} <span className="font-normal text-zinc-500">· {payment.packageKey}</span></p><p className="mt-1 break-all text-[11px] text-zinc-600">{payment.reference} · {dateTime(payment.createdAt)}</p></div><div className="flex items-center gap-3"><span className="text-sm font-medium">{money(payment.amountMinor, payment.currency)}</span><span className={`rounded-full px-2 py-1 text-[10px] capitalize ${payment.status === "success" ? "bg-emerald-500/10 text-emerald-300" : payment.status === "failed" ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-200"}`}>{payment.status}</span></div></article>)}{!payments.length && <p className="py-10 text-center text-sm text-zinc-500">{loading ? "Loading payments…" : "No payment records."}</p>}</div></section>}

    {selectedUser && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) { setSelectedUser(null); setUserActivity(null); } }}><section role="dialog" aria-modal="true" aria-labelledby="user-detail-title" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-zinc-700 bg-zinc-950 p-5 sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wide text-violet-300">Account activity</p><h2 id="user-detail-title" className="mt-1 text-xl font-semibold">{selectedUser.name || "Unnamed user"}</h2><p className="text-sm text-zinc-500">{selectedUser.email}</p></div><button onClick={() => { setSelectedUser(null); setUserActivity(null); }} aria-label="Close user details" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800"><X size={18}/></button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"><span className="text-sm text-zinc-400">Current balance <b className="ml-2 text-white">{userActivity?.user?.creditAccount?.balance ?? selectedUser.creditAccount?.balance ?? 0} credits</b></span><button onClick={() => setGrantingUser(selectedUser)} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium">Add credits</button></div><div className="mt-5"><h3 className="text-sm font-semibold">Recent activity</h3>{!userActivity ? <p className="py-8 text-center text-xs text-zinc-500">Loading account history…</p> : <div className="mt-2 divide-y divide-zinc-800">{userActivity.activity.map((event) => <div key={`${event.event}-${event.id}`} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm">{event.label}</p><p className="mt-1 text-[11px] capitalize text-zinc-600">{event.event} · {dateTime(event.createdAt)}</p></div>{event.event === "credit" && <span className={`text-xs ${event.delta > 0 ? "text-emerald-300" : "text-zinc-400"}`}>{event.delta > 0 ? "+" : ""}{event.delta} credits</span>}{event.event === "payment" && <span className="text-xs">{money(event.amountMinor, event.currency)} · {event.status}</span>}</div>)}{!userActivity.activity.length && <p className="py-8 text-center text-xs text-zinc-500">No activity recorded for this account.</p>}</div>}</div></section></div>}

    {grantingUser && <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !savingGrant) setGrantingUser(null); }}><form onSubmit={submitGrant} className="w-full max-w-md space-y-4 rounded-t-3xl border border-zinc-700 bg-zinc-950 p-5 sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-violet-300">Manual credit grant</p><h2 className="mt-1 text-xl font-semibold">Top up account</h2><p className="mt-1 text-xs text-zinc-500">{grantingUser.name || grantingUser.email}</p></div><button type="button" onClick={() => setGrantingUser(null)} aria-label="Close credit form" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800"><X size={18}/></button></div><label className="block text-sm text-zinc-300">Credits<input required type="number" min="1" max="1000000" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-violet-500"/></label><label className="block text-sm text-zinc-300">Reason for grant<textarea required minLength="3" maxLength="240" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer support compensation" rows="3" className="mt-2 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-violet-500"/></label><p className="text-[11px] leading-5 text-zinc-500">This adjustment is recorded in the user’s credit history with the administrator and reason.</p><button disabled={savingGrant || !Number(amount) || !reason.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold disabled:opacity-50">{savingGrant ? <><LoaderCircle size={16} className="animate-spin"/> Adding credits…</> : <><ArrowUpRight size={16}/> Grant {Number(amount || 0).toLocaleString()} credits</>}</button></form></div>}
  </div>;
}

function Metric({ label, value }) { return <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div>; }
