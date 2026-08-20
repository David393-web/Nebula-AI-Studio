import {
    Bell,
    Search,
    Moon,
    Command
} from "lucide-react";

export default function Navbar() {
    return (
        <header className="flex items-center justify-between h-20 px-8 border-b border-zinc-800 bg-zinc-950">

            {/* Left */}

            <div className="flex items-center gap-4">

                <div className="relative">

                    <Search
                        size={18}
                        className="absolute -translate-y-1/2 left-4 top-1/2 text-zinc-500"
                    />

                    <input
                        type="text"
                        placeholder="Search projects, images..."
                        className="py-3 pr-4 text-sm transition border outline-none  w-96 rounded-xl border-zinc-800 bg-zinc-900 pl-11 focus:border-violet-600"
                    />

                </div>

                <button
                    className="flex items-center gap-2 px-4 py-3 text-sm border  rounded-xl border-zinc-800 bg-zinc-900 text-zinc-400"
                >
                    <Command size={16} />

                    Ctrl K
                </button>

            </div>

            {/* Right */}

            <div className="flex items-center gap-4">

                <button className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800">

                    <Moon size={18} />

                </button>

                <button className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800">

                    <Bell size={18} />

                </button>

                <div className="flex items-center gap-3">

                    <div className="rounded-full h-11 w-11 bg-violet-600" />

                    <div>

                        <h3 className="font-semibold">
                            Samuel
                        </h3>

                        <p className="text-xs text-zinc-400">
                            Creator
                        </p>

                    </div>

                </div>

            </div>

        </header>
    );
}