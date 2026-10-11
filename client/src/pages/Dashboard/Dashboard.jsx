import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowLeft, ArrowRight, Clapperboard, FolderOpen, Image, Images, LoaderCircle, Sparkles, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import useAuth from "@/hooks/useAuth";

const tiles = [
  { label: "Projects", path: "/projects", icon: FolderOpen, key: "projects" },
  { label: "Images", path: "/images", icon: Image, key: "images" },
  { label: "Videos", path: "/videos", icon: Video, key: "videos" },
  { label: "Characters", path: "/characters", icon: Users, key: "characters" },
];
const actions = [
  { label: "Generate image", path: "/generate", icon: Sparkles },
  { label: "Open projects", path: "/projects", icon: FolderOpen },
  { label: "Storyboard", path: "/storyboard", icon: Clapperboard },
  { label: "Creative library", path: "/gallery", icon: Images },
];

// All generation cards prefill only the prompt field supported by GeneratePanel.
const useCases = [
  { title: "Script to Film", category: "STORYTELLING", description: "Shape a scene, build its storyboard, then bring it to life.", path: "/storyboard", image: "photo-1485846234645-a62644f84728", icon: Clapperboard, fit: "object-cover" },
  { title: "Product Ad Spot", category: "PRODUCT", description: "Create a polished product visual with a commercial feel.", prompt: "Premium product advertising image, clear product silhouette, polished commercial lighting, generous negative space.", image: "photo-1542291026-7eec264c27ff", icon: Image },
  { title: "Branded Campaign Film", category: "CAMPAIGN", description: "Plan a sequence of scenes for a cohesive campaign.", path: "/storyboard", image: "photo-1531058020387-3be344556be6", icon: Clapperboard },
  { title: "Photorealistic Portraits", category: "PORTRAIT", description: "Explore expressive portraits with natural detail and light.", prompt: "Photorealistic editorial portrait, natural skin texture, soft directional studio light, refined composition.", image: "photo-1534528741775-53994a69daeb", icon: Image },
  { title: "Character Creation", category: "CHARACTERS", description: "Create and organize characters for your projects.", path: "/characters", image: "photo-1535713875002-d1d0cf3775c5", icon: Users },
  { title: "Cinematic Concept Art", category: "CONCEPT ART", description: "Find the mood and visual direction for your next idea.", prompt: "Cinematic environment concept art, atmospheric depth, deliberate color palette, dramatic but readable composition.", image: "photo-1470252649378-9c29740c9fa8", icon: Image },
  { title: "Social Campaign Visuals", category: "SOCIAL", description: "Build a bold image around one clear focal point.", prompt: "Bold social media visual with one clear focal point, strong color contrast, and space for a headline to be added later.", image: "photo-1490481651871-ab68de25d43d", icon: Image },
];

// Curated from tools and starter presets currently available in the application.
const whatsNew = [
  { eyebrow: "STARTER PRESETS", title: "A faster way to find your starting point", body: "Browse image and video starters, then apply a prompt and settings in Generate.", path: "/generate", action: "Browse presets", image: "photo-1516035069371-29a1b244cc32", icon: Sparkles },
  { eyebrow: "GENERATION MODELS", title: "Choose a model for the work", body: "Compare configured image and video models in the generation workspace.", path: "/generate", action: "Explore models", image: "photo-1518770660439-4636190af475", icon: Image },
  { eyebrow: "STORYBOARD WORKSPACE", title: "Build scenes into a story", body: "Organize scenes, edit their direction, and continue into image and video creation.", path: "/storyboard", action: "Open storyboard", image: "photo-1500530855697-b586d89ba3ee", icon: Clapperboard },
  { eyebrow: "CHARACTER LIBRARY", title: "Keep your characters close", body: "Create and manage character references for your creative projects.", path: "/characters", action: "Explore characters", image: "photo-1534528741775-53994a69daeb", icon: Users },
];

function ImageCard({ image, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  return <div className={`absolute inset-0 overflow-hidden bg-gradient-to-br from-violet-950 via-zinc-900 to-zinc-950 ${className}`}>
    {!failed && <img src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=1000&q=80`} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
  </div>;
}

function SectionHeading({ eyebrow, title, description, onPrev, onNext, label }) {
  return <div className="mb-5 flex items-end justify-between gap-4">
    <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-violet-300">{eyebrow}</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2><p className="mt-1 text-xs text-zinc-500 sm:text-sm">{description}</p></div>
    {onPrev && <div className="flex shrink-0 gap-2"><button type="button" onClick={onPrev} aria-label={`Previous ${label}`} className="rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 transition hover:border-violet-500/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"><ArrowLeft size={16}/></button><button type="button" onClick={onNext} aria-label={`Next ${label}`} className="rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 transition hover:border-violet-500/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"><ArrowRight size={16}/></button></div>}
  </div>;
}

function Carousel({ children, label, forwardedRef }) {
  return <div ref={forwardedRef} aria-label={label} tabIndex={0} className="grid snap-x snap-mandatory auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 sm:auto-cols-[48%] lg:auto-cols-[32%] xl:auto-cols-[24%] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent">{children}</div>;
}

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const [data, setData] = useState({ projects: [], images: [], videos: [], characters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const casesRef = useRef(null);
  const updatesRef = useRef(null);
  const scroll = (ref, direction) => ref.current?.scrollBy({ left: direction * Math.max(ref.current.clientWidth * 0.8, 280), behavior: "smooth" });

  useEffect(() => { let live = true; (async () => { try { const [p, i, v, c] = await Promise.all([api.get("/projects"), api.get("/images"), api.get("/videos"), api.get("/characters")]); if (live) setData({ projects: p.data?.data?.projects || [], images: i.data?.data?.images || [], videos: v.data?.data?.videos || [], characters: c.data?.data?.characters || [] }); } catch (e) { if (live) setError(e.response?.data?.message || "Some workspace data could not be loaded."); } finally { if (live) setLoading(false); } })(); return () => { live = false; }; }, []);

  return <div data-tour="dashboard-overview" className="space-y-9 text-white sm:space-y-11">
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-violet-500/20 bg-gradient-to-br from-[#21123d] via-[#171322] to-zinc-950 p-6 sm:p-9 lg:p-11">
      <div className="absolute -right-8 -top-20 -z-10 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-[90px]"/><div className="absolute bottom-0 right-[18%] -z-10 h-40 w-40 rounded-full bg-violet-600/15 blur-[70px]"/>
      <div className="relative z-10 max-w-2xl"><p className="flex items-center gap-2 text-xs font-medium text-violet-300"><Sparkles size={14}/> NEBULA AI STUDIO</p><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Your creative workspace for images, video, characters, and stories. Continue a project or start with a new idea.</p><Link to="/generate" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"><Sparkles size={16}/> Start creating <ArrowRight size={15}/></Link></div>
      <div className="relative z-10 mt-8 grid grid-cols-2 gap-2 border-t border-white/10 pt-5 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0 sm:flex sm:gap-7 sm:border-0 sm:pt-0">{tiles.map(({ label, path, icon: Icon, key }) => <Link key={key} to={path} className="group flex items-center gap-2 rounded-lg py-1 text-xs text-zinc-400 transition hover:text-white"><Icon size={14} className="text-violet-300"/>{label}<span className="font-semibold text-white">{loading ? "—" : data[key].length}</span></Link>)}</div>
    </section>

    <section aria-labelledby="use-cases-heading"><SectionHeading eyebrow="MAKE SOMETHING" title="Explore use cases" description="Start with a creative direction, then make it your own." onPrev={() => scroll(casesRef, -1)} onNext={() => scroll(casesRef, 1)} label="use cases"/><h2 id="use-cases-heading" className="sr-only">Explore use cases</h2>
      <Carousel forwardedRef={casesRef} label="Use cases carousel">{useCases.map(({ title, category, description, path, prompt, image, icon: Icon }) => { const to = path || `/generate?prompt=${encodeURIComponent(prompt)}`; return <Link key={title} to={to} className="group relative isolate flex h-[245px] snap-start flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/50 hover:shadow-xl hover:shadow-violet-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:h-[270px]"><ImageCard image={image} alt=""/><div className="absolute inset-0 -z-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5"/><div className="relative z-10"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[9px] font-semibold tracking-[.15em] text-violet-100 backdrop-blur"><Icon size={11}/>{category}</span><h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-1 line-clamp-2 max-w-xs text-xs leading-5 text-zinc-300">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white">Explore <ArrowDownRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"/></span></div></Link>; })}</Carousel>
    </section>

    <section aria-labelledby="whats-new-heading"><SectionHeading eyebrow="IN THE STUDIO" title="What's New" description="Discover the tools and creative starting points available in Nebula." onPrev={() => scroll(updatesRef, -1)} onNext={() => scroll(updatesRef, 1)} label="What's New"/><h2 id="whats-new-heading" className="sr-only">What's New</h2>
      <Carousel forwardedRef={updatesRef} label="What's New carousel">{whatsNew.map(({ eyebrow, title, body, path, action, image, icon: Icon }) => <article key={title} className="group grid min-h-[180px] snap-start grid-cols-[112px_1fr] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 transition hover:border-violet-500/40 sm:min-h-[190px] sm:grid-cols-[145px_1fr]"><div className="relative isolate min-h-full overflow-hidden"><ImageCard image={image} alt=""/><div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent to-zinc-900/30"/><span className="absolute bottom-3 left-3 z-10 rounded-xl border border-white/15 bg-black/40 p-2 text-violet-200 backdrop-blur"><Icon size={16}/></span></div><div className="flex min-w-0 flex-col items-start justify-center p-3 sm:p-4"><p className="text-[9px] font-semibold tracking-[.13em] text-violet-300">{eyebrow}</p><h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white sm:text-base">{title}</h3><p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-zinc-400 sm:text-xs">{body}</p><Link to={path} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">{action}<ArrowRight size={12}/></Link></div></article>)}</Carousel>
    </section>

    <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Your workspace</h2><p className="mt-1 text-sm text-zinc-500">Live totals from your account</p></div>{loading && <LoaderCircle size={18} className="animate-spin text-zinc-500" aria-label="Loading workspace"/>}</div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(({ label, path, icon: Icon, key }) => <Link key={key} to={path} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-violet-500/40"><div className="flex items-center justify-between"><span className="text-sm text-zinc-400">{label}</span><Icon size={18} className="text-violet-400"/></div><p className="mt-3 text-2xl font-semibold">{loading ? "—" : data[key].length}</p></Link>)}</div>{error && <p className="mt-3 text-sm text-amber-300">{error}</p>}</section>

    <section className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Recent projects</h2><p className="mt-1 text-xs text-zinc-500">Pick up where you left off</p></div><Link to="/projects" className="text-xs text-violet-300">All projects <ArrowRight className="inline" size={13}/></Link></div>{data.projects.slice(0, 5).map((p) => <Link key={p.id} to={`/projects/${p.id}/workspace`} className="flex items-center gap-3 border-t border-zinc-800/70 py-3"><FolderOpen size={18} className="text-violet-400"/><span className="min-w-0 flex-1 truncate text-sm">{p.name}</span><span className="text-xs text-zinc-600">{new Date(p.updatedAt || p.createdAt).toLocaleDateString()}</span></Link>)}{!loading && !data.projects.length && <p className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">No projects yet. <Link to="/projects" className="text-violet-300">Create one</Link></p>}</div><div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"><h2 className="font-semibold">Create and explore</h2><p className="mt-1 text-xs text-zinc-500">Open one of your creative tools</p><div className="mt-4 space-y-2">{actions.map(({ label, path, icon: Icon }) => <Link key={label} to={path} className="flex items-center gap-3 rounded-xl bg-zinc-950/70 p-3 text-sm text-zinc-300 hover:bg-zinc-800"><Icon size={17} className="text-violet-400"/>{label}<ArrowRight className="ml-auto text-zinc-600" size={15}/></Link>)}</div></div></section>
  </div>;
}
