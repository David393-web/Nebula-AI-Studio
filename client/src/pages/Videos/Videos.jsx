import {
  Video,
  Search,
  Upload,
  Sparkles,
  Play,
  MoreHorizontal,
} from "lucide-react";

const demoVideos = [
  {
    id: 1,
    title: "Cinematic Product Reveal",
    duration: "00:12",
    image:
      "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=900&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "AI Short Film",
    duration: "00:24",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Fashion Campaign",
    duration: "00:08",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Travel Sequence",
    duration: "00:18",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900&auto=format&fit=crop",
  },
];

export default function Videos() {
  return (
    <div className="min-h-full text-white bg-zinc-950">
      {/* Header */}
      <section className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-purple-400">
            <Video size={16} />
            <span>Creative Library</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Videos
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Create and manage cinematic AI-generated videos.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            <Upload size={16} />
            Upload
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700">
            <Sparkles size={16} />
            Generate Video
          </button>
        </div>
      </section>

      {/* Search */}
      <section className="flex gap-3 p-3 mb-8 border rounded-2xl border-zinc-800 bg-zinc-900/70">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute -translate-y-1/2 left-4 top-1/2 text-zinc-500"
          />

          <input
            type="text"
            placeholder="Search videos..."
            className="w-full py-3 pr-4 text-sm text-white border outline-none rounded-xl pl-11 bg-zinc-950 border-zinc-800 placeholder:text-zinc-600"
          />
        </div>

        <button className="hidden px-4 text-sm border rounded-xl md:block border-zinc-800 bg-zinc-950 text-zinc-400">
          All videos
        </button>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <Stat label="Total Videos" value="82" />
        <Stat label="Generated" value="76" />
        <Stat label="Projects" value="14" />
        <Stat label="Favorites" value="9" />
      </div>

      {/* Videos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Videos</h2>

          <span className="text-xs text-zinc-600">
            82 assets
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {demoVideos.map((video) => (
            <div
              key={video.id}
              className="overflow-hidden border rounded-2xl border-zinc-800 bg-zinc-900"
            >
              <div className="relative overflow-hidden aspect-video bg-zinc-950 group">
                <img
                  src={video.image}
                  alt={video.title}
                  className="object-cover w-full h-full transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <button className="flex items-center justify-center w-12 h-12 text-white transition bg-purple-600 rounded-full shadow-xl hover:scale-105">
                    <Play size={19} fill="currentColor" />
                  </button>
                </div>

                <span className="absolute bottom-3 right-3 px-2 py-1 text-[11px] rounded-md bg-black/70">
                  {video.duration}
                </span>

                <button className="absolute flex items-center justify-center w-8 h-8 rounded-lg top-3 right-3 bg-black/60 text-zinc-300">
                  <MoreHorizontal size={17} />
                </button>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-medium">
                  {video.title}
                </h3>

                <p className="mt-1 text-xs text-zinc-600">
                  AI generated video
                </p>
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