import {
  Moon,
  Sun,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import nebulaLogo from "@/assets/Images/nebula-logo.png";
import { useAuthStore } from "@/stores/auth/authStore";
import { getSettings, updateSettings } from "@/services/settings";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(true);
  const user = useAuthStore((state) => state.user);
  useEffect(() => { getSettings().then((settings) => { const dark = settings.theme !== "light"; setDarkMode(dark); document.documentElement.dataset.theme = dark ? "dark" : "light"; }).catch(() => {}); }, []);
  const toggleTheme = async () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { await updateSettings({ theme: next ? "dark" : "light" }); } catch { setDarkMode(!next); document.documentElement.dataset.theme = next ? "light" : "dark"; }
  };

  return (
    <header className="sticky top-0 z-40 flex h-[64px] shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 px-4 backdrop-blur-xl md:h-[72px] md:justify-end md:px-6">

      <Link to="/" aria-label="Nebula AI home" className="flex items-center gap-2 md:hidden"><img src={nebulaLogo} alt="" className="h-9 w-9 object-contain"/><span className="text-sm font-semibold">Nebula AI</span></Link>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">

        <Link to="/billing" className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-3 text-sm font-medium text-white hover:bg-violet-500 sm:px-4">
          <CreditCard size={16} /><span>Upgrade</span>
        </Link>

        {/* Theme */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 transition border rounded-xl border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <Moon size={18} />
          ) : (
            <Sun size={18} />
          )}
        </button>

        {/* Profile */}
        <Link
          to="/settings"
          className="ml-1 flex items-center gap-3 rounded-xl px-1 py-1.5 transition hover:bg-zinc-900 md:ml-2 md:px-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-700 text-sm font-semibold text-white md:h-10 md:w-10">
            {(user?.name || user?.email || "U").slice(0,1).toUpperCase()}
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-white">
              {user?.name || user?.email || "Account"}
            </p>

            <p className="text-xs text-zinc-500">
              {user?.role || "Creator"}
            </p>
          </div>
        </Link>

      </div>
    </header>
  );
}
