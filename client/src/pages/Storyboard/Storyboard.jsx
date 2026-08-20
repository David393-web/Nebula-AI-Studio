import {
  Clapperboard,
  Plus,
  Search,
  Sparkles,
  MoreHorizontal,
  Play,
} from "lucide-react";

const scenes = [
  {
    id: 1,
    number: "01",
    title: "Opening Scene",
    description: "The story begins in a quiet city at night.",
  },
  {
    id: 2,
    number: "02",
    title: "The Encounter",
    description: "Our main character meets a mysterious stranger.",
  },
  {
    id: 3,
    number: "03",
    title: "The Chase",
    description: "A sudden chase begins through the city.",
  },
  {
    id: 4,
    number: "04",
    title: "The Revelation",
    description: "The truth behind the mysterious encounter is revealed.",
  },
];

export default function Storyboard() {
  return (
    <div className="min-h-full text-white bg-zinc-950">
      {/* Header */}
      <section className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-purple-400">
            <Clapperboard size={16} />
            <span>Story Studio</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Storyboard
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Plan scenes, characters and visual direction before generating.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            <Search size={16} />
            Find Scene
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700">
            <Plus size={17} />
            New Scene
          </button>
        </div>
      </section>

      {/* Project bar */}
      <section className="flex flex-col gap-4 p-5 mb-8 border rounded-2xl border-zinc-800 bg-zinc-900 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-zinc-600">
            CURRENT PROJECT
          </p>

          <h2 className="mt-1 font-medium">
            Untitled Story
          </h2>
        </div>

        <div className="flex items-center gap-5 text-xs text-zinc-500">
          <span>4 scenes</span>
          <span>3 characters</span>
          <span>16:9</span>
        </div>
      </section>

      {/* Storyboard */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Scenes
          </h2>

          <button className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300">
            <Sparkles size={14} />
            Generate All
          </button>
        </div>

        <div className="space-y-4">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="flex flex-col gap-5 p-4 transition border rounded-2xl border-zinc-800 bg-zinc-900 hover:border-zinc-700 md:flex-row"
            >
              {/* Preview */}
              <div className="relative flex-shrink-0 w-full overflow-hidden rounded-xl md:w-56 aspect-video bg-zinc-950">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clapperboard
                    size={30}
                    className="text-zinc-700"
                  />
                </div>

                <div className="absolute flex items-center justify-center text-xs font-semibold rounded-lg top-3 left-3 w-9 h-7 bg-black/70">
                  {scene.number}
                </div>

                <button className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-full w-9 h-9 left-1/2 top-1/2 bg-purple-600/90">
                  <Play
                    size={15}
                    fill="currentColor"
                  />
                </button>
              </div>

              {/* Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-purple-400">
                      SCENE {scene.number}
                    </p>

                    <h3 className="mt-1 text-lg font-medium">
                      {scene.title}
                    </h3>

                    <p className="max-w-2xl mt-2 text-sm leading-6 text-zinc-500">
                      {scene.description}
                    </p>
                  </div>

                  <button className="flex-shrink-0 p-2 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  <span className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 text-zinc-400">
                    Image
                  </span>

                  <span className="px-2.5 py-1 text-[11px] rounded-lg bg-purple-500/10 text-purple-400">
                    Ready to generate
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}