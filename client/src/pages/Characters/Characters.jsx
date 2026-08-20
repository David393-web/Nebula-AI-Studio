import {
  Users,
  Search,
  Plus,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";

const demoCharacters = [
  {
    id: 1,
    name: "Mharion",
    role: "Main Character",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Alex",
    role: "Supporting Character",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Elena",
    role: "Main Character",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop",
  },
];

export default function Characters() {
  return (
    <div className="min-h-full text-white bg-zinc-950">
      {/* Header */}
      <section className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-purple-400">
            <Users size={16} />
            <span>Character Studio</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Characters
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Create reusable characters for your images, videos and stories.
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700">
          <Plus size={17} />
          Create Character
        </button>
      </section>

      {/* Hero */}
      <section className="relative p-8 mb-8 overflow-hidden border rounded-3xl border-zinc-800 bg-gradient-to-br from-purple-950/50 via-zinc-900 to-zinc-950">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-3 text-purple-400">
            <Sparkles size={18} />
            <span className="text-sm font-medium">
              Character consistency
            </span>
          </div>

          <h2 className="text-2xl font-semibold">
            Build characters that stay consistent.
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Create a character once and reuse their identity across
            different scenes, images and videos.
          </p>

          <button className="flex items-center gap-2 px-4 py-2.5 mt-6 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700">
            <Sparkles size={16} />
            Create your first character
          </button>
        </div>

        <div className="absolute w-64 h-64 rounded-full bg-purple-600/10 blur-3xl -right-20 -top-20" />
      </section>

      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={18}
          className="absolute -translate-y-1/2 left-4 top-1/2 text-zinc-500"
        />

        <input
          type="text"
          placeholder="Search characters..."
          className="w-full py-3.5 pr-4 text-sm text-white border rounded-xl outline-none pl-11 bg-zinc-900 border-zinc-800 placeholder:text-zinc-600"
        />
      </div>

      {/* Characters */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Characters</h2>

          <span className="text-xs text-zinc-600">
            18 characters
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {demoCharacters.map((character) => (
            <div
              key={character.id}
              className="overflow-hidden border rounded-2xl border-zinc-800 bg-zinc-900 group"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
                <img
                  src={character.image}
                  alt={character.name}
                  className="object-cover w-full h-full transition duration-500 group-hover:scale-105"
                />

                <button className="absolute flex items-center justify-center w-8 h-8 rounded-lg top-3 right-3 bg-black/60 text-zinc-300">
                  <MoreHorizontal size={17} />
                </button>
              </div>

              <div className="p-4">
                <h3 className="font-medium">
                  {character.name}
                </h3>

                <p className="mt-1 text-xs text-zinc-600">
                  {character.role}
                </p>

                <button className="w-full py-2.5 mt-4 text-xs font-medium transition border rounded-lg border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                  Open Character
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}