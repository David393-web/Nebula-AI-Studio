import Logo from "../Logo";

import {
    LayoutDashboard,
    FolderOpen,
    Image,
    Video,
    Users,
    Clapperboard,
    Images,
    Download,
    Settings
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/"
    },
    {
        title: "Projects",
        icon: FolderOpen,
        path: "/projects"
    },
    {
        title: "Images",
        icon: Image,
        path: "/images"
    },
    {
        title: "Videos",
        icon: Video,
        path: "/videos"
    },
    {
        title: "Characters",
        icon: Users,
        path: "/characters"
    },
    {
        title: "Storyboard",
        icon: Clapperboard,
        path: "/storyboard"
    },
    {
        title: "Gallery",
        icon: Images,
        path: "/gallery"
    },
    {
        title: "Downloads",
        icon: Download,
        path: "/downloads"
    },
    {
        title: "Settings",
        icon: Settings,
        path: "/settings"
    }
];

export default function Sidebar() {
    return (
        <aside className="flex h-screen w-72 flex-col border-r border-zinc-800 bg-zinc-950">

            <div className="border-b border-zinc-800 p-6">
                <Logo />
            </div>

            <nav className="flex-1 px-4 py-6">

                {navigation.map(({ title, icon: Icon, path }) => (

                    <NavLink
                        key={title}
                        to={path}
                        className={({ isActive }) =>
                            `mb-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-all
                            ${
                                isActive
                                    ? "bg-violet-600 text-white"
                                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                            }`
                        }
                    >
                        <Icon size={20} />

                        <span>{title}</span>

                    </NavLink>

                ))}

            </nav>

            <div className="border-t border-zinc-800 p-5">

                <div className="rounded-xl bg-zinc-900 p-4">

                    <p className="text-xs text-zinc-500">
                        Storage
                    </p>

                    <p className="mt-1 font-semibold text-white">
                        0.8 GB / 20 GB
                    </p>

                </div>

            </div>

        </aside>
    );
}