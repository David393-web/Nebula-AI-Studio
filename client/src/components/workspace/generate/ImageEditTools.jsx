import { useState } from "react";
import { ImagePlus, LoaderCircle, WandSparkles } from "lucide-react";
import api from "@/services/api";
import { getImages } from "@/services/media";
import FileDropzone from "@/components/media/FileDropzone";

export default function ImageEditTools({ onComplete }) {
  const [images, setImages] = useState([]);
  const [imageId, setImageId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("idle");
  const [cost, setCost] = useState(null);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState([]);

  const loadImages = () => {
    getImages().then(setImages).catch(() => setError("Could not load saved images."));
    api.get("/credits/costs").then(({ data }) => setCost(data?.data?.imageOperations?.edit ?? null)).catch(() => {});
  };

  const uploadSource = async (files, rejected = []) => {
    setError(rejected.join(" · ")); if (!files.length) return;
    setStatus("uploading");
    const uploaded = []; const failures = [];
    for (const file of files) {
      try {
        const form = new FormData(); form.append("file", file);
        const { data } = await api.post("/storage/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
        const image = data?.data?.image;
        if (!image?.id) throw new Error("The uploaded image could not be saved to your library.");
        uploaded.push(image);
      } catch (e) { failures.push(`${file.name}: ${e.response?.data?.message || e.message || "Upload failed"}`); }
    }
    if (uploaded.length) { setImages((current) => [...uploaded, ...current]); setImageId(uploaded[0].id); }
    setError([rejected.join(" · "), failures.join(" · ")].filter(Boolean).join(" · "));
    setStatus(failures.length || rejected.length ? uploaded.length ? "idle" : "failed" : "idle");
  };

  const process = async () => {
    if (!imageId || !prompt.trim() || status === "processing") return;
    setStatus("processing"); setError(""); setOutputs([]);
    try {
      const { data } = await api.post("/generation/image/process", { imageId, prompt: prompt.trim() }, { timeout: 360000, headers: { "Idempotency-Key": crypto.randomUUID() } });
      const rows = data?.data?.images || [];
      setOutputs(rows); setImages((current) => [...rows, ...current]); setStatus("completed"); onComplete?.(rows);
    } catch (e) { setError(e.response?.data?.message || "Image editing failed. Please try again."); setStatus("failed"); }
  };

  return <details onToggle={(event) => { if (event.currentTarget.open) loadImages(); }} className="rounded-2xl border border-zinc-800 bg-zinc-900">
    <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5">
      <span className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300"><WandSparkles size={18}/></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-white">Edit an existing image <span className="font-normal text-zinc-500">· optional</span></span><span className="mt-1 block text-xs text-zinc-500">Choose or upload an image, then describe the change.</span></span>
    </summary>
    <div className="space-y-4 border-t border-zinc-800 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="space-y-2 text-xs text-zinc-400">Source image<select value={imageId} onChange={(e) => setImageId(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"><option value="">Choose an image…</option>{images.map((image) => <option key={image.id} value={image.id}>{image.name || "Untitled image"}</option>)}</select></label>
        <FileDropzone onFiles={uploadSource} label="Upload source images" description="Drop one or more images" className="sm:min-w-52" disabled={status === "uploading"}/>
      </div>
      {imageId && <img src={images.find((image) => image.id === imageId)?.thumbnailUrl || images.find((image) => image.id === imageId)?.url} alt="Selected source" className="max-h-56 max-w-full rounded-xl border border-zinc-800 object-contain"/>}
      <label className="block space-y-2 text-xs text-zinc-400">What would you like to change?<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1200} rows={3} placeholder="For example: Change the shirt to black while keeping the person and composition the same." className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white outline-none focus:border-violet-500"/></label>
      {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
      <button type="button" disabled={!imageId || !prompt.trim() || ["uploading", "processing"].includes(status)} onClick={process} className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{status === "uploading" || status === "processing" ? <><LoaderCircle size={16} className="animate-spin"/>{status === "uploading" ? "Uploading…" : "Editing image…"}</> : <><ImagePlus size={16}/>{status === "completed" ? "Edit another image" : `Apply edit${cost ? ` · ${cost} credits` : ""}`}</>}</button>
      {outputs.length > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{outputs.map((image) => <figure key={image.id} className="overflow-hidden rounded-xl border border-zinc-800"><img src={image.thumbnailUrl || image.url} alt={image.name} loading="lazy" className="max-h-96 w-full bg-zinc-950 object-contain"/><figcaption className="p-3 text-xs text-zinc-400">Edited result · saved to your library</figcaption></figure>)}</div>}
    </div>
  </details>;
}
