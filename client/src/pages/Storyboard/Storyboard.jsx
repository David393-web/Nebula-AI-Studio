import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clapperboard, LoaderCircle, Plus, Search } from "lucide-react";
import api from "@/services/api";

export default function Storyboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/projects"), api.get("/storyboards")])
      .then(([projectResponse, storyboardResponse]) => {
        if (!active) return;
        setProjects(projectResponse.data?.data?.projects || []);
        setScenes(storyboardResponse.data?.data?.storyboards || []);
      })
      .catch((e) => { if (active) setError(e.response?.data?.message || "Could not load your projects."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => projects.filter((project) => (project.name || "").toLowerCase().includes(query.toLowerCase())), [projects, query]);

  return <div className="space-y-7 text-white">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm text-violet-400">Story studio</p><h1 className="mt-2 text-3xl font-semibold">Storyboards</h1><p className="mt-2 text-sm text-zinc-500">Choose a project to write its script, build scenes, assign characters and images, then generate scene clips.</p></div>
      <button type="button" onClick={() => navigate("/projects")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium hover:bg-violet-500"><Plus size={16}/>Create project</button>
    </header>
    <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a project…" className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm outline-none focus:border-violet-500"/></div>
    {error && <div role="alert" className="rounded-xl border border-red-500/20 p-4 text-sm text-red-300">{error}</div>}
    {loading ? <div className="flex justify-center py-20 text-zinc-500"><LoaderCircle className="animate-spin"/></div> : filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((project) => {
      const projectScenes = scenes.filter((scene) => scene.projectId === project.id);
      return <article key={project.id} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><Clapperboard size={19}/></span>
        <h2 className="truncate font-medium">{project.name || "Untitled project"}</h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-zinc-500">{project.script || project.description || "Add a story script and scene-by-scene visual plan."}</p>
        <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4"><span className="text-xs text-zinc-500">{projectScenes.length} scene{projectScenes.length === 1 ? "" : "s"}</span><button type="button" onClick={() => navigate(`/projects/${project.id}/workspace?tab=storyboard`)} className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700">Open storyboard<ArrowRight size={14}/></button></div>
      </article>;
    })}</div> : <div className="rounded-2xl border border-dashed border-zinc-800 py-20 text-center"><Clapperboard size={32} className="mx-auto text-zinc-600"/><p className="mt-3 font-medium">{query ? "No matching projects" : "Create a project to start a storyboard"}</p><p className="mt-1 text-sm text-zinc-500">Scripts, scenes, source images and generated clips are kept together in a project.</p></div>}
  </div>;
}
