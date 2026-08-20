import {
  Search,
  Grid2X2,
  List,
  MoreHorizontal,
  Image as ImageIcon,
  Heart,
  Download,
  Folder,
} from "lucide-react";
import { useState } from "react";

const galleryItems = [
  {
    id: 1,
    title: "Neon City",
    category: "Cinematic",
    type: "Image",
    gradient: "from-violet-900 via-purple-700 to-blue-900",
  },
  {
    id: 2,
    title: "Creative Workspace",
    category: "Interior",
    type: "Image",
    gradient: "from-zinc-700 via-zinc-500 to-zinc-800",
  },
  {
    id: 3,
    title: "Fashion Campaign",
    category: "Fashion",
    type: "Image",
    gradient: "from-cyan-700 via-teal-600 to-zinc-900",
  },
  {
    id: 4,
    title: "AI Portrait",
    category: "Portrait",
    type: "Image",
    gradient: "from-purple-800 via-pink-700 to-zinc-900",
  },
  {
    id: 5,
    title: "Future Architecture",
    category: "Architecture",
    type: "Image",
    gradient: "from-blue-900 via-indigo-700 to-zinc-900",
  },
  {
    id: 6,
    title: "Product Render",
    category: "Product",
    type: "Image",
    gradient: "from-orange-700 via-red-700 to-zinc-900",
  },
];

export default function Gallery() {
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");

  const filteredItems = galleryItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full text-white bg-zinc-950">

      {/* Header */}
      <div className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-purple-400">
            <ImageIcon size={16} />
            <span>Creative Library</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Gallery
          </h1>

          <p className="mt-2 text-zinc-500">
            Browse, organize and manage your creative assets.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-white transition bg-purple-600 w-fit rounded-xl hover:bg-purple-500"
        >
          <Folder size={18} />
          Create Collection
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-3 mb-8 border rounded-2xl border-zinc-800 bg-zinc-900/60 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute -translate-y-1/2 left-4 top-1/2 text-zinc-500"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gallery..."
            className="w-full pr-4 text-sm text-white border outline-none h-11 rounded-xl border-zinc-800 bg-zinc-950 pl-11 placeholder:text-zinc-600 focus:border-purple-500/50"
          />
        </div>

        <button
          type="button"
          className="px-5 py-3 text-sm border rounded-xl border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
        >
          All assets
        </button>

        <button
          type="button"
          className="px-5 py-3 text-sm border rounded-xl border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
        >
          Recent
        </button>

        <div className="flex p-1 border rounded-xl border-zinc-800 bg-zinc-950">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-lg p-2 ${
              view === "grid"
                ? "bg-purple-600 text-white"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            <Grid2X2 size={17} />
          </button>

          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-lg p-2 ${
              view === "list"
                ? "bg-purple-600 text-white"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            <List size={17} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard label="Total Assets" value="428" />
        <StatCard label="Images" value="326" />
        <StatCard label="Videos" value="82" />
        <StatCard label="Favorites" value="20" />
      </div>

      {/* Section heading */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">
          Your Gallery
        </h2>

        <span className="text-sm text-zinc-600">
          {filteredItems.length} assets
        </span>
      </div>

      {/* Gallery */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <GalleryListItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="py-20 text-center border border-dashed rounded-2xl border-zinc-800">
          <ImageIcon
            size={40}
            className="mx-auto mb-4 text-zinc-700"
          />

          <h3 className="font-medium text-zinc-300">
            No assets found
          </h3>

          <p className="mt-2 text-sm text-zinc-600">
            Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-5 border rounded-2xl border-zinc-800 bg-zinc-900/60">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function GalleryCard({ item }) {
  return (
    <div className="overflow-hidden transition border group rounded-2xl border-zinc-800 bg-zinc-900 hover:border-purple-500/40">

      {/* Preview */}
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${item.gradient}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon
            size={56}
            strokeWidth={1.2}
            className="text-white/30"
          />
        </div>

        <div className="absolute px-3 py-1 text-xs text-white rounded-lg left-3 top-3 bg-black/50 backdrop-blur">
          {item.category}
        </div>

        <button
          type="button"
          className="absolute p-2 text-white transition rounded-lg opacity-0 right-3 top-3 bg-black/50 backdrop-blur group-hover:opacity-100"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">
              {item.title}
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              {item.type} · Recently created
            </p>
          </div>

          <button
            type="button"
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <Heart size={17} />
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-800">
          <button
            type="button"
            className="text-xs text-zinc-500 hover:text-white"
          >
            Open
          </button>

          <button
            type="button"
            className="text-zinc-500 hover:text-white"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function GalleryListItem({ item }) {
  return (
    <div className="flex items-center gap-4 p-3 border rounded-2xl border-zinc-800 bg-zinc-900 hover:border-purple-500/40">
      <div
        className={`flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient}`}
      >
        <ImageIcon size={24} className="text-white/50" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white">
          {item.title}
        </h3>

        <p className="text-sm text-zinc-500">
          {item.category} · {item.type}
        </p>
      </div>

      <button
        type="button"
        className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white"
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}