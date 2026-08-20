export default function VideoPreview({
  video,
  loading = false,
  className = "",
}) {
  return (
    <div
      className={`relative overflow-hidden border rounded-2xl border-zinc-800 bg-zinc-950 ${className}`}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-10 h-10 border-2 border-purple-500 rounded-full border-t-transparent animate-spin" />

          <p className="mt-4 text-sm text-zinc-400">
            Preparing video...
          </p>
        </div>
      ) : video ? (
        <video
          src={video}
          controls
          className="object-contain w-full min-h-[320px] bg-black"
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[320px] px-6 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-400"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-white">
            No video generated yet
          </h3>

          <p className="max-w-sm mt-2 text-xs leading-5 text-zinc-500">
            Generate a video from your selected scenes and
            the finished result will appear here.
          </p>
        </div>
      )}
    </div>
  );
}