import {
  GripVertical,
  Plus,
  Clapperboard,
  Sparkles,
  Image as ImageIcon,
  Video,
} from "lucide-react";

export default function SceneTimeline({
  scenes = [],
  selectedScene,
  onSelect,
  onAdd,
  onGenerate,
}) {
  const validScenes = scenes.filter(
    (scene) => scene?.id,
  );

  return (
    <div className="border rounded-2xl border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <h3 className="font-semibold text-white">
            Scene Sequence
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            Organize your scenes for generation.
          </p>
        </div>

        <span className="px-2.5 py-1 text-xs font-medium rounded-lg text-purple-400 bg-purple-500/10">
          {validScenes.length}{" "}
          {validScenes.length === 1
            ? "Scene"
            : "Scenes"}
        </span>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {validScenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center border border-dashed rounded-xl border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-zinc-900">
              <Clapperboard
                size={22}
                className="text-zinc-600"
              />
            </div>

            <h4 className="text-sm font-medium text-zinc-300">
              No scenes yet
            </h4>

            <p className="max-w-sm mt-1 text-xs leading-5 text-zinc-600">
              Add a scene to start building your
              generation sequence.
            </p>

            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="flex items-center gap-2 px-4 py-2 mt-4 text-xs font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Plus size={14} />
                Add Scene
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {validScenes.map(
              (scene, index) => {
                const selected =
                  selectedScene?.id ===
                  scene?.id;

                const sceneType =
                  scene?.type || "image";

                return (
                  <div
                    key={scene.id}
                    className={`flex items-center gap-3 p-3 transition border rounded-xl ${
                      selected
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    {/* Sequence Indicator */}
                    <div
                      className="flex-shrink-0 text-zinc-700"
                      aria-hidden="true"
                    >
                      <GripVertical size={17} />
                    </div>

                    {/* Select Scene */}
                    <button
                      type="button"
                      onClick={() =>
                        onSelect?.(scene)
                      }
                      className="flex items-center flex-1 min-w-0 gap-3 text-left"
                      aria-label={`Select ${
                        scene?.title ||
                        `Scene ${index + 1}`
                      }`}
                    >
                      {/* Scene Number */}
                      <div
                        className={`flex items-center justify-center flex-shrink-0 w-9 h-9 text-xs font-semibold rounded-lg ${
                          selected
                            ? "text-purple-300 bg-purple-500/20"
                            : "text-zinc-500 bg-zinc-900"
                        }`}
                      >
                        {String(
                          index + 1,
                        ).padStart(2, "0")}
                      </div>

                      {/* Scene Info */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {scene?.title ||
                            scene?.name ||
                            `Scene ${index + 1}`}
                        </p>

                        <p className="mt-1 text-xs truncate text-zinc-600">
                          {scene?.prompt ||
                            scene?.description ||
                            "No generation prompt"}
                        </p>
                      </div>
                    </button>

                    {/* Generation Type */}
                    <span
                      className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase rounded-md ${
                        sceneType === "video"
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-purple-400 bg-purple-500/10"
                      }`}
                    >
                      {sceneType ===
                      "video" ? (
                        <Video size={11} />
                      ) : (
                        <ImageIcon
                          size={11}
                        />
                      )}

                      {sceneType}
                    </span>

                    {/* Generate */}
                    {onGenerate && (
                      <button
                        type="button"
                        onClick={() =>
                          onGenerate?.(scene)
                        }
                        className="flex items-center gap-1.5 flex-shrink-0 px-3 py-2 text-xs font-medium text-purple-400 transition border rounded-lg border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:text-purple-300"
                      >
                        <Sparkles
                          size={14}
                        />
                        Generate
                      </button>
                    )}
                  </div>
                );
              },
            )}

            {/* Add Scene */}
            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="flex items-center justify-center w-full gap-2 px-4 py-3 mt-3 text-xs font-medium transition border border-dashed rounded-xl text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-700 hover:bg-zinc-950"
              >
                <Plus size={15} />
                Add Scene
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}