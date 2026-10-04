import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth/authStore";

const steps = [
  { title: "Welcome to Nebula AI Studio", body: "Your creative workspace brings image and video generation, projects, and billing together. Take a quick tour to see where everything lives.", route: "/dashboard" },
  { title: "Your dashboard", body: "See your workspace totals, jump back into recent projects, and open the creative tools you use most.", route: "/dashboard", target: "[data-tour='dashboard-overview']" },
  { title: "Image Studio", body: "Choose Image to generate from a prompt, tune the settings, and edit or refine your creations in the workspace.", route: "/generate", target: "[data-tour='image-studio']" },
  { title: "Video Studio", body: "Switch to Video, add a reference image, describe the motion you want, and create an AI video.", route: "/generate", target: "[data-tour='video-studio']" },
  { title: "Credits and billing", body: "Your balance includes free and purchased credits. Review usage, see configured packages, and find payment history here.", route: "/billing", target: "[data-tour='billing-balance']" },
  { title: "Projects and saved creations", body: "Projects keep your work organized. Open a project to continue editing, or use Images, Videos, and Gallery to find saved creations.", route: "/projects", target: "[data-tour='projects-list']" },
  { title: "Ready to create?", body: "That’s the tour. Start with an image or video prompt whenever you’re ready.", route: "/generate" },
];

export default function OnboardingTour() {
  const user = useAuthStore((state) => state.user); const setUser = useAuthStore((state) => state.setUser); const [active, setActive] = useState(false); const [index, setIndex] = useState(0); const [rect, setRect] = useState(null); const navigate = useNavigate(); const location = useLocation();
  const current = steps[index];
  const finish = useCallback(async () => { setActive(false); setRect(null); try { const { data } = await api.patch("/auth/onboarding"); if (data?.data?.user) setUser(data.data.user); } catch { setUser({ ...useAuthStore.getState().user, onboardingCompleted: true }); } }, [setUser]);
  useEffect(() => { if (user && user.onboardingCompleted === false) { setIndex(0); setActive(true); } }, [user?.id, user?.onboardingCompleted]);
  useEffect(() => { const replay = () => { setIndex(0); setActive(true); }; window.addEventListener("nebula:replay-onboarding", replay); return () => window.removeEventListener("nebula:replay-onboarding", replay); }, []);
  useEffect(() => { if (!active) return; if (location.pathname !== current.route) navigate(current.route); }, [active, current.route, location.pathname, navigate]);
  useEffect(() => {
    if (!active || !current.target || location.pathname !== current.route) { setRect(null); return; }
    let frame; let timer; const measure = () => { const element = document.querySelector(current.target); if (!element) return; element.scrollIntoView({ block: "center", behavior: "smooth" }); const box = element.getBoundingClientRect(); setRect({ top: box.top - 8, left: box.left - 8, width: box.width + 16, height: box.height + 16 }); };
    timer = window.setTimeout(() => { frame = requestAnimationFrame(measure); }, 120); window.addEventListener("resize", measure); window.addEventListener("scroll", measure, true);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [active, current, location.pathname]);
  if (!active) return null;
  const advance = async () => { if (index === steps.length - 1) { await finish(); navigate("/generate"); } else setIndex((value) => value + 1); };
  const back = () => setIndex((value) => Math.max(0, value - 1));
  const skip = () => finish();
  const compact = typeof window !== "undefined" && window.innerWidth < 640;
  const popoverStyle = rect ? { top: Math.min(window.innerHeight - 270, Math.max(16, rect.top + rect.height + 14)), left: compact ? 16 : Math.max(16, Math.min(window.innerWidth - 400, rect.left + rect.width / 2 - 190)) } : {};
  return <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-labelledby="tour-title"><svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`} preserveAspectRatio="none"><defs><mask id="nebula-tour-mask"><rect width="100%" height="100%" fill="white"/>{rect&&<rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx="16" fill="black"/>}</mask></defs><rect width="100%" height="100%" fill="rgba(0,0,0,.78)" mask="url(#nebula-tour-mask)"/></svg>{rect && <div aria-hidden="true" className="pointer-events-none fixed z-[111] rounded-2xl border-2 border-violet-400 shadow-[0_0_0_1px_rgba(167,139,250,.2)] transition-all duration-300" style={rect}/>}<section className={`absolute z-[112] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-white shadow-2xl ${rect ? "" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"}`} style={popoverStyle}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wider text-violet-300">Nebula AI Studio · {index + 1} of {steps.length}</p><h2 id="tour-title" className="mt-2 text-lg font-semibold">{current.title}</h2></div><button onClick={skip} aria-label="Skip tour" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"><X size={18}/></button></div><p className="mt-3 text-sm leading-6 text-zinc-400">{current.body}</p><div className="mt-6 flex items-center justify-between gap-2"><button onClick={skip} className="text-xs text-zinc-500 hover:text-white">Skip Tour</button><div className="flex gap-2"><button disabled={index === 0} onClick={back} className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-xs disabled:opacity-40"><ArrowLeft size={14}/> Back</button><button onClick={advance} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium hover:bg-violet-500">{index === steps.length - 1 ? "Start Creating" : "Next"}<ArrowRight size={14}/></button></div></div></section></div>;
}
