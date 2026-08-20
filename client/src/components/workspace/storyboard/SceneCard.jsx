import {
  Clapperboard,
  Pencil,
  Trash2,
  Sparkles,
  User,
  Image as ImageIcon,
  Video,
} from "lucide-react";

export default function SceneCard({
  scene,
  index,
  onEdit,
  onDelete,
  onSelect,
  onGenerate,
  selected = false,
}) {
  const generatedUrl = scene?.generatedUrl;
  const generatedType =
    scene?.generatedType || scene?.type || "image";

  const hasGeneration = Boolean(generatedUrl);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition ${
        selected
          ? "border-purple-500 bg-purple-500/5"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      {/* Scene Preview */}
      <button
        type="button"
        onClick={() => onSelect?.(scene)}
        className="block w-full text-left"
      >
        <div className="relative overflow-hidden aspect-video bg-zinc-950">
          {hasGeneration && generatedType === "video" ? (
            <video
              src={generatedUrl}
              className="object-cover w-full h-full"
              muted
              playsInline
              controls
            />
          ) : hasGeneration && generatedType === "image" ? (
            <img
              src={generatedUrl}
              alt={
                scene?.title ||
                `Scene ${index + 1}`
              }
              className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
            />
          ) : scene?.image ? (
            <img
              src={scene.image}
              alt={
                scene?.title ||
                `Scene ${index + 1}`
              }
              className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-zinc-600">
              <Clapperboard size={30} />

              <span className="mt-2 text-xs">
                No generation yet
              </span>
            </div>
          )}

          {/* Scene Number */}
          <div className="absolute flex items-center justify-center w-8 h-8 text-xs font-semibold text-white rounded-lg top-3 left-3 bg-black/70 backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Generation Type */}
          {hasGeneration && (
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-white uppercase rounded-lg bg-black/70 backdrop-blur-sm">
                {generatedType === "video" ? (
                  <Video size={12} />
                ) : (
                  <ImageIcon size={12} />
                )}

                {generatedType}
              </span>
            </div>
          )}

          {/* Generated Badge */}
          {hasGeneration && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 text-[10px] font-medium text-green-300 rounded-md bg-green-500/20 backdrop-blur-sm">
                Generated
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Scene Information */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">
              {scene?.title ||
                `Scene ${index + 1}`}
            </h3>

            <p className="mt-1 text-xs leading-5 text-zinc-500 line-clamp-2">
              {scene?.prompt ||
                "No scene prompt added yet."}
            </p>
          </div>

          {/* Edit */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.(scene);
            }}
            className="flex items-center justify-center flex-shrink-0 w-8 h-8 transition rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
            aria-label="Edit scene"
          >
            <Pencil size={15} />
          </button>
        </div>

        {/* Character */}
        {scene?.character && (
          <div className="flex items-center gap-2 px-3 py-2 mt-4 border rounded-lg border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-center flex-shrink-0 overflow-hidden rounded-md w-7 h-7 bg-purple-500/10">
              {scene.character.image ? (
                <img
                  src={scene.character.image}
                  alt={
                    scene.character.name
                  }
                  className="object-cover w-full h-full"
                />
              ) : (
                <User
                  size={14}
                  className="text-purple-400"
                />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wide">
                Character
              </p>

              <p className="text-xs font-medium text-purple-400 truncate">
                {scene.character.name}
              </p>
            </div>
          </div>
        )}

        {/* Generation Status */}
        <div className="flex items-center gap-2 mt-4">
          <span
            className={`w-2 h-2 rounded-full ${
              hasGeneration
                ? "bg-green-400"
                : "bg-zinc-600"
            }`}
          />

          <span className="text-xs text-zinc-500">
            {hasGeneration
              ? "Generation ready"
              : "Not generated"}
          </span>
        </div>

        {/* Scene Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-zinc-800">
          <span className="text-xs capitalize text-zinc-600">
            {scene?.type || "image"}
          </span>

          <div className="flex items-center gap-2">
            {/* Generate */}
            <button
              type="button"
              onClick={() =>
                onGenerate?.(scene)
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-400 transition rounded-lg bg-purple-500/10 hover:bg-purple-500/20 hover:text-purple-300"
            >
              <Sparkles size={13} />

              {hasGeneration
                ? "Regenerate"
                : "Generate"}
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() =>
                onDelete?.(scene?.id)
              }
              className="flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-red-400"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}