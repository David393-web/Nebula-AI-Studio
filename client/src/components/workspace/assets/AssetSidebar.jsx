import {
  Images,
  Video,
  Users,
  FolderOpen,
  Sparkles,
} from "lucide-react";

const filters = [
  {
    id: "all",
    label: "All Assets",
    icon: FolderOpen,
  },
  {
    id: "image",
    label: "Images",
    icon: Images,
  },
  {
    id: "video",
    label: "Videos",
    icon: Video,
  },
  {
    id: "character",
    label: "Characters",
    icon: Users,
  },
];

export default function AssetSidebar({
  activeFilter = "all",
  onFilterChange,
  counts = {},
}) {
  return (
    <aside className="w-full xl:w-56 xl:flex-shrink-0">
      <div className="p-4 border rounded-2xl border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 px-2 mb-4">
          <Sparkles
            size={16}
            className="text-purple-400"
          />

          <h3 className="text-sm font-semibold text-white">
            Asset Library
          </h3>
        </div>

        <nav className="space-y-1">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const active =
              activeFilter === filter.id;

            const count =
              filter.id === "all"
                ? counts.all ?? 0
                : counts[filter.id] ?? 0;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() =>
                  onFilterChange?.(filter.id)
                }
                className={`flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-xl transition ${
                  active
                    ? "bg-purple-600/15 text-purple-400"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} />

                  <span>{filter.label}</span>
                </span>

                <span
                  className={`min-w-6 px-1.5 py-0.5 text-xs text-center rounded-full ${
                    active
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}