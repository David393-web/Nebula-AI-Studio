import { useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, WandSparkles } from "lucide-react";
import api from "@/services/api";
import { getImages } from "@/services/media";

const options = [
  { id: "edit", label: "AI Edit" },
  { id: "variation", label: "Variations" },
  { id: "relight", label: "Relight" },
];

export default function ImageEditTools({ onComplete }) {
  const [images, setImages] = useState([]);
  const [imageId, setImageId] = useState("");
  const [operation, setOperation] = useState("edit");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(2);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState([]);
  const [costs, setCosts] = useState(null);

  useEffect(() => { getImages().then((rows) => { setImages(rows); if (rows[0]) setImageId(rows[0].id); }).catch(() => setError("Could not load your saved images.")); api.get("/credits/costs").then(({ data }) => { if (data?.data?.imageOperations) setCosts(data.data.imageOperations); }).catch(() => {}); }, []);

  const process = async () => {
    if (!imageId || !prompt.trim() || status === "processing") return;
    setStatus("processing"); setError(""); setOutputs([]);
    try {
      const { data } = await api.post("/generation/image/process", { imageId, operation, prompt: prompt.trim(), count }, { timeout: 360000, headers: { "Idempotency-Key": crypto.randomUUID() } });
      const rows = data?.data?.images || [];
      setOutputs(rows); setImages((current) => [...rows, ...current]); setStatus("completed"); onComplete?.(rows);
    } catch (e) { setError(e.response?.data?.message || "Image processing failed. Your credits were not retained for a failed operation."); setStatus("failed"); }
  };

  return <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
    <div className="flex items-start gap-3"><div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300"><WandSparkles size={19}/></div><div><h3 className="font-medium text-white">Image to Image · Edit · Relight</h3><p className="mt-1 text-xs leading-5 text-zinc-500">Use a saved image with FLUX.2 Pro. Results are saved beside the source in its project.</p></div></div>
    {!images.length ? <div className="rounded-xl border border-dashed border-zinc-700 p-5 text-sm text-zinc-400">Save or generate an image before using image editing.</div> : <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <label className="space-y-2 text-xs text-zinc-400">Source image<select value={imageId} onChange={(e) => setImageId(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white">{images.map((image) => <option key={image.id} value={image.id}>{image.name || image.prompt || "Untitled image"}</option>)}</select></label>
      <label className="space-y-2 text-xs text-zinc-400">Tool<select value={operation} onChange={(e) => setOperation(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white">{options.map((item) => <option key={item.id} value={item.id}>{item.label} · {costs?.[item.id] ?? "—"}{item.id === "variation" ? " credits each" : " credits"}</option>)}</select></label>
      <label className="space-y-2 text-xs text-zinc-400 sm:col-span-2">Instruction<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1200} rows={3} placeholder={operation === "relight" ? "Warm golden-hour lighting" : "Change the shirt to black; preserve the person and composition"} className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white outline-none focus:border-violet-500"/></label>
      {operation === "variation" && <label className="space-y-2 text-xs text-zinc-400">Number of variations<select value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"><option value={2}>2 variations · {costs ? costs.variation * 2 : "—"} credits</option><option value={4}>4 variations · {costs ? costs.variation * 4 : "—"} credits</option></select></label>}
    </div>}
    {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
    <button type="button" disabled={!images.length || !prompt.trim() || status === "processing"} onClick={process} className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{status === "processing" ? <><LoaderCircle size={16} className="animate-spin"/> Processing image…</> : <><ImagePlus size={16}/> {status === "completed" ? "Create another result" : "Process image"}</>}</button>
    {outputs.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{outputs.map((image) => <figure key={image.id} className="overflow-hidden rounded-xl border border-zinc-800"><img src={image.thumbnailUrl || image.url} alt={image.name} loading="lazy" className="aspect-square w-full object-cover"/><figcaption className="truncate p-2 text-xs text-zinc-400">{image.name}</figcaption></figure>)}</div>}
  </section>;
}
