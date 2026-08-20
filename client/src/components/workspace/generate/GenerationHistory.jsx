import {
  Image as ImageIcon,
  Play,
  Trash2,
} from "lucide-react";

export default function GenerationHistory({
  generations = [],
  onSelect,
  onDelete,
}) {
  if (generations.length === 0) {
    return (
      <div className="p-5 border rounded-2xl border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <ImageIcon
            size={17}
            className="text-purple-400"
          />

          <h3 className="text-sm font-medium text-white">
            Generation History
          </h3>
        </div>

        <div className="flex items-center justify-center min-h-[140px]">
          <p className="text-sm text-zinc-600">
            Your generated images and videos will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border rounded-2xl border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">
            Generation History
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            Your recent creations.
          </p>
        </div>

        <span className="text-xs text-zinc-600">
          {generations.length}{" "}
          {generations.length === 1
            ? "generation"
            : "generations"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {generations.map((generation) => (
          <div
            key={generation.id}
            className="relative overflow-hidden border rounded-xl group border-zinc-800 bg-zinc-950"
          >
            <button
              type="button"
              onClick={() => onSelect?.(generation)}
              className="block w-full text-left"
            >
              <div className="aspect-square">
                {generation.type === "video" ? (
                  <div className="relative flex items-center justify-center w-full h-full">
                    <video
                      src={generation.url}
                      muted
                      className="object-cover w-full h-full"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60">
                        <Play
                          size={17}
                          className="ml-0.5 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={generation.url}
                    alt="Generated"
                    className="object-cover w-full h-full transition group-hover:scale-105"
                  />
                )}
              </div>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(generation.id)}
                className="absolute flex items-center justify-center w-8 h-8 transition rounded-lg opacity-0 top-2 right-2 bg-black/70 text-zinc-300 hover:text-red-400 group-hover:opacity-100"
                title="Delete generation"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}