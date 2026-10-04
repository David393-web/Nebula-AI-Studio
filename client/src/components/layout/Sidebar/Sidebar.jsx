import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar.data";
import nebulaLogo from "@/assets/Images/nebula-logo.png";
import { Home, Folder, Images, Settings, Grid2X2, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";

const mobileItems = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Projects", path: "/projects", icon: Folder },
  { label: "Gallery", path: "/gallery", icon: Images },
  { label: "Tools", path: "/generate", icon: Grid2X2 },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [toolsOpen, setToolsOpen] = useState(false);
  return (
    <>
    <aside className="hidden h-full w-[250px] shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 md:flex">
      {/* Brand */}
      <div className="flex h-[82px] shrink-0 items-center gap-3 border-b border-zinc-800/70 px-5">
        <img
          src={nebulaLogo}
          alt="Nebula AI"
          className="object-contain w-20 h-20"
        />

        <div className="min-w-0">
          <p className="text-base font-semibold text-white truncate">
            Nebula AI
          </p>

          <p className="text-xs text-zinc-500">Studio</p>
        </div>
      </div>

      {/* Create */}
      <div className="px-4 pt-5 shrink-0">
        <Link to="/generate"
          className="flex items-center justify-center w-full gap-2 text-sm font-semibold text-white transition shadow-lg h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 shadow-purple-900/20 hover:brightness-110"
        >
          <span className="text-lg leading-none">+</span>
          Create
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 px-3 pt-5">
        {sidebarItems.map((item) => (
          <SidebarItem key={item.label} {...item} />
        ))}
      </nav>

      {/* Storage */}
      <div className="p-4 border-t shrink-0 border-zinc-800/70">
        <div className="p-4 border rounded-xl border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-500">Account</span>
            <Link to="/settings" className="text-xs text-violet-400">Usage</Link>
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-sm font-semibold text-white">Manage</span>
            <span className="text-xs text-zinc-500">usage & storage</span>
          </div>

          <Link to="/settings" className="text-xs text-zinc-500 hover:text-white">View account settings →</Link>
        </div>
      </div>
    </aside>
    <>
      {toolsOpen && <div className="fixed inset-0 z-[60] bg-black/60 md:hidden" onClick={() => setToolsOpen(false)} />}
      {toolsOpen && <section className="fixed inset-x-0 bottom-[70px] z-[70] max-h-[70dvh] overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-900 p-5 md:hidden">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">All tools</h2><button aria-label="Close tools" onClick={() => setToolsOpen(false)} className="rounded-lg p-2 text-zinc-400"><X size={20}/></button></div>
        <div className="grid grid-cols-2 gap-2">{sidebarItems.filter(item => !["Dashboard", "Projects", "Settings"].includes(item.label)).map(({label,path,icon:Icon}) => <NavLink key={label} to={path} onClick={() => setToolsOpen(false)} className="flex items-center gap-3 rounded-xl bg-zinc-950 p-4 text-sm text-zinc-200"><Icon size={18} className="text-violet-400"/>{label}</NavLink>)}</div>
      </section>}
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 grid h-[68px] grid-cols-5 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {mobileItems.map(({label,path,icon:Icon}) => label === "Tools" ? <button key={label} onClick={() => setToolsOpen(value => !value)} className={`flex flex-col items-center justify-center gap-1 text-[10px] ${toolsOpen ? "text-violet-300" : "text-zinc-500"}`}><Icon size={20}/>{label}</button> : <NavLink key={label} to={path} className={({isActive}) => `flex flex-col items-center justify-center gap-1 text-[10px] ${isActive ? "text-violet-300" : "text-zinc-500"}`}><Icon size={20}/>{label}</NavLink>)}
      </nav>
    </>
    </>
  );
}
