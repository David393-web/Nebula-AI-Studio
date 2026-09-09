import { Sparkles, Clock3 } from "lucide-react";

export default function VideoSettings({
  quality = "1080P",
  onQualityChange,
  duration = "5",
  onDurationChange,
}) {
  const qualities = [
    {
      value: "720P",
      label: "720P",
      description: "Lower cost",
    },
    {
      value: "1080P",
      label: "1080P",
      description: "Higher detail",
    },
  ];

  const durations = [
    {
      value: "5",
      label: "5 seconds",
      description: "Quick clip",
    },
    {
      value: "10",
      label: "10 seconds",
      description: "Standard clip",
    },
    {
      value: "15",
      label: "15 seconds",
      description: "Longest available",
    },
  ];

  return (
    <div className="border rounded-2xl border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/10">
          <Sparkles
            size={18}
            className="text-purple-400"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">
            Video Settings
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            Configure your final video output.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Quality */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles
              size={15}
              className="text-zinc-500"
            />

            <label className="text-xs font-medium text-zinc-300">
              Generation Quality
            </label>
          </div>

          <div className="space-y-2">
            {qualities.map((option) => {
              const active =
                quality === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onQualityChange?.(
                      option.value,
                    )
                  }
                  className={`flex items-center justify-between w-full p-3 text-left transition border rounded-xl ${
                    active
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        active
                          ? "text-purple-300"
                          : "text-white"
                      }`}
                    >
                      {option.label}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {option.description}
                    </p>
                  </div>

                  <span
                    className={`flex items-center justify-center w-4 h-4 border rounded-full ${
                      active
                        ? "border-purple-400"
                        : "border-zinc-700"
                    }`}
                  >
                    {active && (
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock3
              size={15}
              className="text-zinc-500"
            />

            <label className="text-xs font-medium text-zinc-300">
              Video Duration
            </label>
          </div>

          <div className="space-y-2">
            {durations.map((option) => {
              const active =
                duration === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onDurationChange?.(
                      option.value,
                    )
                  }
                  className={`flex items-center justify-between w-full p-3 text-left transition border rounded-xl ${
                    active
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        active
                          ? "text-purple-300"
                          : "text-white"
                      }`}
                    >
                      {option.label}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {option.description}
                    </p>
                  </div>

                  <span
                    className={`flex items-center justify-center w-4 h-4 border rounded-full ${
                      active
                        ? "border-purple-400"
                        : "border-zinc-700"
                    }`}
                  >
                    {active && (
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 border rounded-xl border-purple-500/10 bg-purple-500/5">
          <p className="text-[11px] leading-5 text-zinc-500">
            Wan preserves the aspect ratio of the source storyboard image.
            Higher resolutions and longer clips may increase generation time.
          </p>
        </div>
      </div>
    </div>
  );
}
