import {
  ArrowRight,
  Clapperboard,
  FolderOpen,
  Image,
  Images,
  Search,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { Link } from "react-router-dom";

const tools = [
  {
    label: "Image Generator",
    description: "Create AI images",
    icon: Image,
    color: "violet",
    path: "/images",
  },
  {
    label: "Video Generator",
    description: "Create AI videos",
    icon: Video,
    color: "blue",
    path: "/videos",
  },
  {
    label: "Character Studio",
    description: "Build reusable characters",
    icon: Users,
    color: "purple",
    path: "/characters",
  },
  {
    label: "Storyboard",
    description: "Plan scenes and stories",
    icon: Clapperboard,
    color: "pink",
    path: "/storyboard",
  },
  {
    label: "Projects",
    description: "Manage your projects",
    icon: FolderOpen,
    color: "violet",
    path: "/projects",
  },
  {
    label: "Creative Library",
    description: "Browse your assets",
    icon: Images,
    color: "blue",
    path: "/gallery",
  },
];

const stats = [
  {
    label: "Projects",
    value: "24",
    icon: FolderOpen,
  },
  {
    label: "Images",
    value: "326",
    icon: Image,
  },
  {
    label: "Videos",
    value: "82",
    icon: Video,
  },
  {
    label: "Characters",
    value: "18",
    icon: Users,
  },
];

const quickActions = [
  {
    label: "New Image",
    icon: Image,
    path: "/images",
  },
  {
    label: "New Video",
    icon: Video,
    path: "/videos",
  },
  {
    label: "New Character",
    icon: Sparkles,
    path: "/characters",
  },
  {
    label: "New Project",
    icon: FolderOpen,
    path: "/projects",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="pt-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="mb-3 text-sm font-medium text-violet-400">
            Nebula AI Studio
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Welcome back, Samuel
            <span className="ml-2">👋</span>
          </h1>

          <p className="max-w-xl mx-auto mt-3 text-sm leading-6 text-zinc-500 sm:text-base">
            Create images, videos, characters and stories with your AI creative
            workspace.
          </p>
        </div>

        {/* Dashboard Search */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="relative w-full max-w-3xl mx-auto mt-8">
            <Search
              size={20}
              className="absolute -translate-y-1/2 left-5 top-1/2 text-zinc-500"
            />

            <input
              type="text"
              placeholder="Search projects, images, videos..."
              className="w-full pr-24 text-sm text-white transition border outline-none h-14 rounded-2xl border-zinc-800 bg-zinc-900/70 pl-14 placeholder:text-zinc-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10"
            />

            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-500">
              Ctrl K
            </span>
          </div>
        </div>
      </section>

      {/* Creation Tools */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Create something
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Start a new creative workflow.
            </p>
          </div>

          <Link
            to="/generate"
            className="flex items-center gap-1 text-sm transition text-zinc-400 hover:text-white"
          >
            View all
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.label}
                to={tool.path}
                className="group flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-zinc-800/70 bg-zinc-900/40 px-4 py-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-center justify-center w-12 h-12 mb-4 text-purple-400 transition-all duration-200 border rounded-xl border-zinc-800 bg-zinc-900 group-hover:border-purple-500/30 group-hover:bg-purple-500/10 group-hover:text-purple-300">
                  <Icon size={21} strokeWidth={1.8} />
                </div>

                <h3 className="text-sm font-medium text-white">{tool.label}</h3>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {tool.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.label}
                to={stat.path}
                className="p-5 transition-all duration-200 border group rounded-2xl border-zinc-800/70 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">{stat.label}</p>

                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {stat.value}
                    </p>
                  </div>

                  <div className="flex items-center justify-center w-10 h-10 text-purple-400 transition rounded-xl bg-purple-500/10 group-hover:bg-purple-500/15">
                    <Icon size={19} strokeWidth={1.8} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        {/* Recent Projects */}
        <div className="p-5 border rounded-2xl border-zinc-800/70 bg-zinc-900/40">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Projects
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Continue working on your latest projects.
              </p>
            </div>

            <Link
              to="/projects"
              className="text-sm transition text-zinc-500 hover:text-white"
            >
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {[
              "Nike Campaign",
              "Anime Intro",
              "AI Short Film",
              "Product Render",
            ].map((project) => (
              <Link
                key={project}
                to="/projects"
                className="flex items-center justify-between px-4 py-4 transition border border-transparent group rounded-xl bg-zinc-950/40 hover:border-zinc-800 hover:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 text-purple-400 rounded-lg bg-purple-500/10">
                    <FolderOpen size={19} strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {project}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Project workspace
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-5 border rounded-2xl border-zinc-800/70 bg-zinc-900/40">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Jump straight into a creative workflow.
            </p>
          </div>

          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className="flex items-center gap-3 px-4 py-4 transition border border-transparent group rounded-xl bg-zinc-950/40 hover:border-zinc-800 hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-center w-10 h-10 text-purple-400 rounded-lg bg-zinc-900">
                    <Icon size={19} strokeWidth={1.8} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">
                      {action.label}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Start a new workflow
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Workspace CTA */}
      <section className="relative p-6 overflow-hidden border rounded-2xl border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-zinc-900/80 to-zinc-950 sm:p-8">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={17} className="text-violet-400" />

            <span className="text-xs font-medium text-violet-400">
              NEBULA WORKSPACE
            </span>
          </div>

          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Turn your ideas into complete stories.
          </h2>

          <p className="max-w-lg mt-2 text-sm leading-6 text-zinc-500">
            Build characters, plan scenes, generate visuals and assemble
            everything into a finished creative project.
          </p>

          <Link
            to="/projects"
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-zinc-950
              transition
              hover:bg-zinc-200
            "
          >
            Open Workspace
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="absolute w-64 h-64 rounded-full pointer-events-none -right-20 -top-20 bg-violet-600/10 blur-3xl" />
      </section>
    </div>
  );
}
