import useGenerationStore from "@/stores/generation/generationStore";

const ratios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const qualities = ["Standard", "High", "Ultra"];

export default function GenerationSettings() {
  const { ratio, quality, setRatio, setQuality } = useGenerationStore();
  return (
    <div className="space-y-5">
      <div><h3 className="text-sm font-medium text-white">Image settings</h3><p className="mt-1 text-xs text-zinc-500">Choose an aspect ratio and output quality.</p></div>
      <div className="space-y-2"><label className="text-xs font-medium text-zinc-400">Aspect ratio</label><div className="grid grid-cols-3 gap-2">{ratios.map((item) => <button key={item} type="button" onClick={() => setRatio(item)} className={`rounded-lg border px-3 py-2.5 text-xs font-medium ${ratio === item ? "border-violet-500 bg-violet-500/10 text-violet-300" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"}`}>{item}</button>)}</div></div>
      <div className="space-y-2"><label className="text-xs font-medium text-zinc-400">Image quality</label><div className="grid grid-cols-3 gap-2">{qualities.map((item) => <button key={item} type="button" onClick={() => setQuality(item)} className={`rounded-lg border px-2 py-2.5 text-xs font-medium ${quality === item ? "border-violet-500 bg-violet-500/10 text-violet-300" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"}`}>{item}</button>)}</div></div>
    </div>
  );
}
