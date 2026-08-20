import {
  Image as ImageIcon,
  Search,
  Upload,
  Sparkles,
  MoreHorizontal,
  Download,
  Trash2,
} from "lucide-react";

const demoImages = [
  {
    id: 1,
    title: "Generated Portrait",
    category: "Portrait",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=900&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Creative Workspace",
    category: "Product",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Neon City",
    category: "Cinematic",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Fashion Campaign",
    category: "Fashion",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Modern Architecture",
    category: "Architecture",
    image:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=900&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Mountain Landscape",
    category: "Landscape",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=900&auto=format&fit=crop",
  },
];

export default function Images() {
  return (
    <div className="min-h-full text-white bg-zinc-950">
      {/* Header */}
      <section className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-purple-400">
            <ImageIcon size={16} />
            <span>Creative Library</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Images
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Generate, manage and organize your AI-generated images.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            <Upload size={16} />
            Upload
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700">
            <Sparkles size={16} />
            Generate Image
          </button>
        </div>
      </section>

      {/* Search / Filters */}
      <section className="flex flex-col gap-3 p-3 mb-8 border rounded-2xl border-zinc-800 bg-zinc-900/70 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute -translate-y-1/2 left-4 top-1/2 text-zinc-500"
          />

          <input
            type="text"
            placeholder="Search images..."
            className="w-full py-3 pr-4 text-sm text-white border outline-none rounded-xl pl-11 bg-zinc-950 border-zinc-800 placeholder:text-zinc-600 focus:border-purple-500/50"
          />
        </div>

        <button className="px-4 py-3 text-sm border rounded-xl border-zinc-800 bg-zinc-950 text-zinc-400">
          All images
        </button>

        <button className="px-4 py-3 text-sm border rounded-xl border-zinc-800 bg-zinc-950 text-zinc-400">
          Recent
        </button>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <Stat label="Total Images" value="326" />
        <Stat label="Generated" value="284" />
        <Stat label="Uploaded" value="42" />
        <Stat label="Favorites" value="18" />
      </div>

      {/* Gallery */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Images</h2>

          <span className="text-xs text-zinc-600">
            326 assets
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {demoImages.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden transition border rounded-2xl border-zinc-800 bg-zinc-900 group hover:border-zinc-700"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
                <img
                  src={item.image}
                  alt={item.title}
                  className="object-cover w-full h-full transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                  <span className="px-2.5 py-1 text-[11px] rounded-lg bg-black/60 backdrop-blur text-zinc-200">
                    {item.category}
                  </span>

                  <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/60 backdrop-blur text-zinc-300 hover:text-white">
                    <MoreHorizontal size={17} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium truncate">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-600">
                    Generated image
                  </p>
                </div>

                <div className="flex gap-1">
                  <button className="p-2 transition rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white">
                    <Download size={15} />
                  </button>

                  <button className="p-2 transition rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-5 border rounded-2xl border-zinc-800 bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}