import {
  Plus,
  Sparkles,
  LayoutList,
  RefreshCw,
} from "lucide-react";

export default function StoryboardToolbar({
  sceneCount = 0,
  onAddScene,
  onGenerateAll,
  onRefresh,
  loading = false,
}) {
  const hasScenes = sceneCount > 0;

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-2xl border-zinc-800 bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
      {/* Left Side */}
      <div className="flex items-center min-w-0 gap-3">
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/10">
          <LayoutList
            size={20}
            className="text-purple-400"
          />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">
            Storyboard
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            {loading
              ? "Loading storyboard..."
              : sceneCount === 0
                ? "No scenes created yet."
                : `${sceneCount} ${
                    sceneCount === 1
                      ? "scene"
                      : "scenes"
                  } ready for generation.`}
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Refresh */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center transition border rounded-lg w-9 h-9 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh storyboard"
            title="Refresh storyboard"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        )}

        {/* Add Scene */}
        {onAddScene && (
          <button
            type="button"
            onClick={onAddScene}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Scene
          </button>
        )}

        {/* Generate All */}
        {onGenerateAll && (
          <button
            type="button"
            onClick={onGenerateAll}
            disabled={
              !hasScenes || loading
            }
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />

            {loading
              ? "Loading..."
              : "Generate All"}
          </button>
        )}
      </div>
    </div>
  );
}