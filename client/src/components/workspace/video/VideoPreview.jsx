import { useMemo, useState } from "react";
import { AlertCircle, Play } from "lucide-react";

export default function VideoPreview({ video }) {
  const [hasError, setHasError] = useState(false);

  const videoUrl = useMemo(() => {
    if (!video) {
      return null;
    }

    return (
      video.url ||
      video.videoUrl ||
      video.outputUrl ||
      video.generatedUrl ||
      null
    );
  }, [video]);

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center min-h-[420px] rounded-2xl border border-dashed border-zinc-800 bg-zinc-950">
        <div className="text-center">
          <AlertCircle
            size={28}
            className="mx-auto mb-3 text-zinc-600"
          />

          <p className="text-sm text-zinc-400">
            Video preview is unavailable.
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            No video URL was returned.
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[420px] rounded-2xl border border-red-900/40 bg-zinc-950">
        <div className="max-w-md px-6 text-center">
          <AlertCircle
            size={30}
            className="mx-auto mb-3 text-red-400"
          />

          <p className="text-sm font-medium text-zinc-200">
            Video could not be played
          </p>

          <p className="mt-2 text-xs leading-5 text-zinc-500">
            The video was generated successfully, but the browser
            could not load the returned video file.
          </p>

          <button
            type="button"
            onClick={() => {
              setHasError(false);
            }}
            className="px-4 py-2 mt-4 text-xs font-medium text-white transition rounded-lg bg-violet-600 hover:bg-violet-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-black border rounded-2xl border-zinc-800">
      <video
        key={videoUrl}
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className="block w-full h-auto max-h-[680px] bg-black"
        onError={() => {
          setHasError(true);
        }}
      >
        Your browser does not support HTML5 video.
      </video>

      <div className="absolute pointer-events-none top-3 left-3">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-white rounded-full bg-black/70 backdrop-blur-sm">
          <Play size={11} fill="currentColor" />
          AI Generated
        </div>
      </div>
    </div>
  );
}