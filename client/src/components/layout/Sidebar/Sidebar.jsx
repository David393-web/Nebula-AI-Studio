import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar.data";
import nebulaLogo from "@/assets/Images/nebula-logo.png";

export default function Sidebar() {
  return (
    <aside className="flex h-full w-[250px] shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950">
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
        <button
          type="button"
          className="flex items-center justify-center w-full gap-2 text-sm font-semibold text-white transition shadow-lg h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 shadow-purple-900/20 hover:brightness-110"
        >
          <span className="text-lg leading-none">+</span>
          Create
        </button>
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
            <span className="text-xs text-zinc-500">Storage</span>

            <span className="text-xs text-zinc-500">4%</span>
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-sm font-semibold text-white">0.8 GB</span>

            <span className="text-xs text-zinc-500">/ 20 GB</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-[4%] rounded-full bg-violet-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}
