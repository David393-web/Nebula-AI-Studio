import useGenerationStore from "@/stores/generation/generationStore";

const models = [
  "Flux Pro",
  "Flux Dev",
  "SDXL",
];

const ratios = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
];

const qualities = [
  "Standard",
  "High",
  "Ultra",
];

export default function GenerationSettings() {
  const {
    model,
    ratio,
    quality,
    setModel,
    setRatio,
    setQuality,
  } = useGenerationStore();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-white">
          Generation Settings
        </h3>

        <p className="mt-1 text-xs text-zinc-500">
          Configure how Nebula should generate your content.
        </p>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">
          AI Model
        </label>

        <select
          value={model}
          onChange={(event) => setModel(event.target.value)}
          className="w-full px-3 py-3 text-sm text-white border outline-none rounded-xl bg-zinc-950 border-zinc-800 focus:border-purple-500"
        >
          {models.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">
          Aspect Ratio
        </label>

        <div className="grid grid-cols-3 gap-2">
          {ratios.map((item) => {
            const active = ratio === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setRatio(item)}
                className={`px-3 py-2.5 text-xs font-medium border rounded-lg transition ${
                  active
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">
          Quality
        </label>

        <div className="grid grid-cols-3 gap-2">
          {qualities.map((item) => {
            const active = quality === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setQuality(item)}
                className={`px-3 py-2.5 text-xs font-medium border rounded-lg transition ${
                  active
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}