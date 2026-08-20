import {
  Monitor,
  Sparkles,
  Clock3,
} from "lucide-react";

export default function VideoSettings({
  aspectRatio = "16:9",
  onAspectRatioChange,
  quality = "high",
  onQualityChange,
  duration = "auto",
  onDurationChange,
}) {
  const aspectRatios = [
    {
      value: "16:9",
      label: "16:9",
      description: "Landscape",
    },
    {
      value: "9:16",
      label: "9:16",
      description: "Portrait",
    },
    {
      value: "1:1",
      label: "1:1",
      description: "Square",
    },
    {
      value: "4:5",
      label: "4:5",
      description: "Social",
    },
  ];

  const qualities = [
    {
      value: "standard",
      label: "Standard",
      description: "Faster generation",
    },
    {
      value: "high",
      label: "High",
      description: "Best balance",
    },
    {
      value: "ultra",
      label: "Ultra",
      description: "Maximum quality",
    },
  ];

  const durations = [
    {
      value: "auto",
      label: "Automatic",
      description: "Based on scenes",
    },
    {
      value: "15s",
      label: "15 seconds",
      description: "Short video",
    },
    {
      value: "30s",
      label: "30 seconds",
      description: "Standard",
    },
    {
      value: "60s",
      label: "60 seconds",
      description: "Long video",
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
        {/* Aspect Ratio */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Monitor
              size={15}
              className="text-zinc-500"
            />

            <label className="text-xs font-medium text-zinc-300">
              Aspect Ratio
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {aspectRatios.map((option) => {
              const active =
                aspectRatio === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onAspectRatioChange?.(
                      option.value,
                    )
                  }
                  className={`p-3 text-left transition border rounded-xl ${
                    active
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      active
                        ? "text-purple-300"
                        : "text-white"
                    }`}
                  >
                    {option.label}
                  </div>

                  <div className="mt-1 text-[10px] text-zinc-600">
                    {option.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
            Higher quality may increase generation time.
            Automatic duration will adapt to the number
            and length of your storyboard scenes.
          </p>
        </div>
      </div>
    </div>
  );
}