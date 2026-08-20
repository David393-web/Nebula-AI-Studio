import {
  Image as ImageIcon,
  Play,
  Download,
  Maximize2,
} from "lucide-react";

export default function GenerationPreview({
  result = null,
  type = "image",
  loading = false,
}) {
  return (
    <div className="flex flex-col h-full min-h-[420px] border rounded-2xl border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {type === "video" ? (
            <Play size={17} className="text-purple-400" />
          ) : (
            <ImageIcon size={17} className="text-purple-400" />
          )}

          <h3 className="text-sm font-medium text-white">
            Preview
          </h3>
        </div>

        {result && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 transition rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Fullscreen"
            >
              <Maximize2 size={16} />
            </button>

            <button
              type="button"
              className="p-2 transition rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Download"
            >
              <Download size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex items-center justify-center flex-1 p-5">
        {loading ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 border-2 rounded-full border-zinc-700 border-t-purple-500 animate-spin" />

            <p className="mt-4 text-sm text-zinc-300">
              Generating...
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Your creation will appear here.
            </p>
          </div>
        ) : result ? (
          type === "video" ? (
            <video
              src={result}
              controls
              className="max-w-full max-h-[500px] rounded-xl"
            />
          ) : (
            <img
              src={result}
              alt="Generated result"
              className="object-contain max-w-full max-h-[500px] rounded-xl"
            />
          )
        ) : (
          <div className="max-w-sm text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-zinc-800">
              {type === "video" ? (
                <Play
                  size={28}
                  className="text-zinc-600"
                />
              ) : (
                <ImageIcon
                  size={28}
                  className="text-zinc-600"
                />
              )}
            </div>

            <h3 className="mt-5 text-sm font-medium text-zinc-300">
              Nothing generated yet
            </h3>

            <p className="mt-2 text-xs leading-5 text-zinc-600">
              Describe what you want to create and generate
              your first {type}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}