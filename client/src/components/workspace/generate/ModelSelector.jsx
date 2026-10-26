import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Search, Sparkles, X } from "lucide-react";
import api from "@/services/api";
import { filterModels, getCapabilityBadges, groupModels, toggleProviderGroup } from "./modelSelector.utils";

const FEATURE_FILTERS = ["References", "First frame", "Audio"];

export default function ModelSelector({ type, value = "auto", onChange, requiredAudio }) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [feature, setFeature] = useState("all");
  const [expanded, setExpanded] = useState({ "Alibaba Cloud": true, Replicate: true });

  const load = async () => {
    setLoading(true); setError("");
    try { const response = await api.get("/generation/models"); setModels(response.data?.data?.models || []); }
    catch (e) { setError(e.response?.data?.message || "Models could not be loaded."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const relevant = useMemo(() => models.filter((model) => model.type === type), [models, type]);
  const providers = [...new Set(relevant.map((model) => model.provider))];
  const filtered = filterModels(relevant, { query, provider, feature });
  const selected = relevant.find((model) => model.id === value);
  const capabilitySummary = getCapabilityBadges;
  const choose = (id) => { onChange?.(id, relevant.find((model) => model.id === id) || null); setOpen(false); setQuery(""); };

  return <div className="relative">
    <div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-medium text-zinc-300">Model</p><p className="mt-1 text-[11px] text-zinc-500">Choose a configured {type} model or let Nebula route automatically.</p></div><button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white hover:border-violet-500" aria-haspopup="dialog">{selected?.displayName || "Auto · recommended"}<ChevronDown size={14}/></button></div>
    {selected && <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3"><div className="flex items-center justify-between"><p className="text-xs font-medium text-violet-200">{selected.displayName}</p><span className={`text-[10px] ${selected.availability === "configured" ? "text-emerald-300" : "text-amber-300"}`}>{selected.availability === "configured" ? "Configured" : selected.availability}</span></div><p className="mt-1 text-[10px] text-zinc-500">{selected.provider} · {selected.apiModelId}</p><div className="mt-2 flex flex-wrap gap-1">{capabilitySummary(selected).map((label) => <span key={label} className="rounded-md bg-zinc-800 px-1.5 py-1 text-[9px] text-zinc-300">{label}</span>)}</div></div>}
    {open && <div role="dialog" aria-modal="true" aria-label="Select a generation model" className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-zinc-700 bg-zinc-950 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4"><div><h3 className="text-base font-semibold text-white">Choose a {type} model</h3><p className="mt-1 text-xs text-zinc-500">Only models configured in this Nebula instance appear here.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Close model selector"><X size={18}/></button></div>
        <div className="grid gap-2 border-b border-zinc-800 p-4 sm:grid-cols-[1fr_auto_auto]"><label className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3"><Search size={15} className="text-zinc-500"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search models or capabilities" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"/></label><select value={provider} onChange={(e) => setProvider(e.target.value)} aria-label="Filter by provider" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white"><option value="all">All providers</option>{providers.map((name) => <option key={name} value={relevant.find((item) => item.provider === name).providerId}>{name}</option>)}</select><select value={feature} onChange={(e) => setFeature(e.target.value)} aria-label="Filter by feature" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white"><option value="all">All features</option>{FEATURE_FILTERS.filter((item) => relevant.some((model) => model.capabilities.includes(item))).map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <button type="button" onClick={() => choose("auto")} className={`mb-4 flex w-full items-center gap-3 rounded-xl border p-3 text-left ${value === "auto" ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/15 text-violet-300"><Sparkles size={17}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-white">Auto · recommended</span><span className="mt-1 block text-xs text-zinc-500">Routes using configured providers and compatible capabilities.</span></span>{value === "auto" && <Check size={16} className="text-violet-300"/>}</button>
          {loading ? <p className="py-8 text-center text-sm text-zinc-500">Loading configured models…</p> : error ? <div className="py-8 text-center"><p className="text-sm text-red-300">{error}</p><button type="button" onClick={load} className="mt-3 text-xs text-violet-300">Try again</button></div> : filtered.length === 0 ? <p className="py-8 text-center text-sm text-zinc-500">No models match these filters.</p> : <><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Featured</p><div className="space-y-2">{filtered.filter((model) => model.featured).map((model) => <ModelRow key={`featured-${model.id}`} model={model} active={value === model.id} onSelect={() => choose(model.id)} summary={capabilitySummary(model)} requiredAudio={requiredAudio}/>)}</div><p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">All models</p>{Object.entries(groupModels(filtered)).map(([providerName, providerModels]) => <section key={providerName} className="mb-2 overflow-hidden rounded-xl border border-zinc-800"><button type="button" aria-expanded={!!expanded[providerName]} onClick={() => setExpanded((current) => toggleProviderGroup(current, providerName))} className="flex w-full items-center gap-2 bg-zinc-900 px-3 py-3 text-left text-sm text-white">{expanded[providerName] ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}<span className="flex-1">{providerName}</span><span className="text-xs text-zinc-500">{providerModels.length}</span></button>{expanded[providerName] && <div className="space-y-2 p-2">{providerModels.map((model) => <ModelRow key={model.id} model={model} active={value === model.id} onSelect={() => choose(model.id)} summary={capabilitySummary(model)} requiredAudio={requiredAudio}/>)}</div>}</section>)}</>}
        </div>
      </div>
    </div>}
  </div>;
}

function ModelRow({ model, active, onSelect, summary, requiredAudio }) {
  const unavailable = model.availability !== "configured";
  const audioConflict = requiredAudio !== undefined && (requiredAudio && model.audioMode === "none" || !requiredAudio && model.audioMode === "automatic");
  return <button type="button" disabled={unavailable || audioConflict} onClick={onSelect} className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left ${active ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"} disabled:cursor-not-allowed disabled:opacity-50`}><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-800 text-[10px] font-bold text-zinc-300">{model.provider === "Replicate" ? "R" : "A"}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-medium text-white">{model.displayName}</span><span className={`text-[9px] ${unavailable || audioConflict ? "text-amber-300" : "text-emerald-300"}`}>{audioConflict ? "Scene audio conflict" : unavailable ? "Disabled" : "Configured"}</span></span><span className="mt-1 block truncate text-[10px] text-zinc-500">{model.provider} · {model.apiModelId}</span><span className="mt-2 flex flex-wrap gap-1">{summary.map((item) => <span key={item} className="rounded bg-zinc-800 px-1.5 py-1 text-[9px] text-zinc-300">{item}</span>)}</span>{unavailable && <span className="mt-1 block text-[10px] text-amber-300">{model.availabilityReason}</span>}{audioConflict && <span className="mt-1 block text-[10px] text-amber-300">This model cannot match the storyboard scene’s saved audio setting.</span>}</span>{active && <Check size={16} className="mt-1 text-violet-300"/>}</button>;
}
