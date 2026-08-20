import {
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <header className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-end border-b border-zinc-800/80 bg-zinc-950/95 px-6 backdrop-blur-xl">

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Theme */}
        <button
          type="button"
          onClick={() => setDarkMode((value) => !value)}
          className="flex items-center justify-center w-10 h-10 transition border rounded-xl border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <Moon size={18} />
          ) : (
            <Sun size={18} />
          )}
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex items-center justify-center w-10 h-10 transition border rounded-xl border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={18} />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
        </button>

        {/* Profile */}
        <button
          type="button"
          className="ml-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-zinc-900"
        >
          <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white rounded-full bg-gradient-to-br from-purple-500 to-violet-700">
            S
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-white">
              Samuel
            </p>

            <p className="text-xs text-zinc-500">
              Creator
            </p>
          </div>
        </button>

      </div>
    </header>
  );
}