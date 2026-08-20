import {
  Search,
  Grid2X2,
  List,
  SlidersHorizontal,
} from "lucide-react";

export default function AssetToolbar({
  search = "",
  onSearchChange,
  view = "grid",
  onViewChange,
}) {
  return (
    <div className="flex flex-col gap-3 p-4 border rounded-2xl border-zinc-800 bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-xl">
        <Search
          size={17}
          className="absolute -translate-y-1/2 left-3 top-1/2 text-zinc-500"
        />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            onSearchChange?.(event.target.value)
          }
          placeholder="Search assets..."
          className="w-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 transition border rounded-xl outline-none bg-zinc-950 border-zinc-800 focus:border-purple-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-400 transition border rounded-xl border-zinc-800 bg-zinc-950 hover:text-white hover:border-zinc-700"
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">
            Filters
          </span>
        </button>

        <div className="flex items-center p-1 border rounded-xl border-zinc-800 bg-zinc-950">
          <button
            type="button"
            onClick={() => onViewChange?.("grid")}
            className={`p-2 rounded-lg transition ${
              view === "grid"
                ? "bg-purple-600 text-white"
                : "text-zinc-500 hover:text-white"
            }`}
            aria-label="Grid view"
          >
            <Grid2X2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => onViewChange?.("list")}
            className={`p-2 rounded-lg transition ${
              view === "list"
                ? "bg-purple-600 text-white"
                : "text-zinc-500 hover:text-white"
            }`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}