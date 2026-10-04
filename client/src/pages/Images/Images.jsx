import { useEffect, useMemo, useState } from "react";
import { Download, Heart, Image as ImageIcon, LoaderCircle, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { deleteImage, getImages, updateImage } from "@/services/media";
import MediaViewer from "@/components/media/MediaViewer";

export default function Images() {
  const [items, setItems] = useState([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [busyId, setBusyId] = useState(null); const [viewerIndex, setViewerIndex] = useState(null);
  const reload = async () => { try { setItems(await getImages()); setError(""); } catch (e) { setError(e.response?.data?.message || "Could not load your images."); } finally { setLoading(false); } };
  useEffect(() => { let active = true; getImages().then((data) => { if (active) setItems(data); }).catch((e) => { if (active) setError(e.response?.data?.message || "Could not load your images."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const filtered = useMemo(() => items.filter((item) => (item.name || item.prompt || "").toLowerCase().includes(query.toLowerCase())), [items, query]);
  const viewerItems = useMemo(() => filtered.filter((item) => !item.uploading).map((item) => ({ ...item, type: "image" })), [filtered]);
  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []); event.target.value = ""; setError("");
    for (const file of files) {
      const id = `upload-${crypto.randomUUID()}`; const previewUrl = URL.createObjectURL(file);
      const preview = { id, name: file.name.replace(/\.[^.]+$/, ""), url: previewUrl, createdAt: new Date().toISOString(), uploading: true };
      setItems((rows) => [preview, ...rows]);
      try {
        const form = new FormData(); form.append("file", file);
        const { data } = await api.post("/storage/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
        const saved = data?.data?.image;
        if (!saved) throw new Error("The uploaded image could not be added to your library.");
        setItems((rows) => rows.map((row) => row.id === id ? saved : row)); URL.revokeObjectURL(previewUrl);
      } catch (e) { setItems((rows) => rows.map((row) => row.id === id ? { ...row, uploading: false, uploadError: true } : row)); setError(e.response?.data?.message || e.message || "Could not upload this image."); }
    }
  };
  const remove = async (item) => { if (String(item.id).startsWith("upload-")) { setItems((rows) => rows.filter((row) => row.id !== item.id)); return; } setBusyId(item.id); try { await deleteImage(item.id); setItems((old) => old.filter((row) => row.id !== item.id)); } catch (e) { setError(e.response?.data?.message || "Could not delete this image."); } finally { setBusyId(null); } };
  const favorite = async (item) => { setBusyId(item.id); try { const saved = await updateImage(item.id, { isFavorite: !item.isFavorite }); setItems((old) => old.map((row) => row.id === item.id ? saved : row)); } catch (e) { setError(e.response?.data?.message || "Could not update this image."); } finally { setBusyId(null); } };
  return <div className="space-y-7 text-white">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-sm text-violet-400"><ImageIcon size={16}/> Creative library</div><h1 className="text-3xl font-semibold">Images</h1><p className="mt-2 text-sm text-zinc-500">Your generated and uploaded images.</p></div><div className="flex gap-2"><label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-medium hover:bg-zinc-900"><Upload size={16}/> Upload images<input type="file" accept="image/*" multiple className="sr-only" onChange={uploadImages}/></label><Link to="/generate" className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium hover:bg-violet-500"><Sparkles size={16}/> Generate image</Link></div></header>
    <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search your images…" className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm outline-none focus:border-violet-500"/></div>
    {error && <div role="alert" className="flex justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}<button onClick={reload} className="underline">Retry</button></div>}
    {loading ? <div className="flex justify-center py-20 text-zinc-500"><LoaderCircle className="animate-spin"/></div> : filtered.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((item)=><article key={item.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70"><button type="button" onClick={()=>!item.uploading && setViewerIndex(viewerItems.findIndex((media) => media.id === item.id))} className="relative block aspect-[4/3] w-full cursor-zoom-in bg-zinc-950 text-left"><img src={item.thumbnailUrl || item.url} alt={item.name || "Image"} className="h-full w-full object-cover" loading="lazy"/>{item.uploading&&<div className="absolute inset-0 grid place-items-center bg-black/60 text-sm"><LoaderCircle size={20} className="mr-2 inline animate-spin"/> Uploading…</div>}</button><div className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><h2 className="truncate text-sm font-medium">{item.name || "Untitled image"}</h2><p className="mt-1 text-xs text-zinc-500">{item.uploadError ? "Upload failed" : item.uploading ? "Uploading" : item.project?.name || new Date(item.createdAt).toLocaleDateString()}</p></div><div className="flex shrink-0 items-center">{!String(item.id).startsWith("upload-") && <a href={`${api.defaults.baseURL}/images/${encodeURIComponent(item.id)}/download`} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800" aria-label="Download image" title="Download image"><Download size={16}/></a>}<button disabled={busyId===item.id||item.uploading} onClick={()=>favorite(item)} aria-label={item.isFavorite ? "Remove favorite" : "Add favorite"} className={`rounded-lg p-2 hover:bg-zinc-800 ${item.isFavorite ? "text-pink-400" : "text-zinc-400"}`}><Heart size={16} fill={item.isFavorite ? "currentColor" : "none"}/></button><button disabled={busyId===item.id} onClick={()=>remove(item)} aria-label="Delete image" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"><Trash2 size={16}/></button></div></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-zinc-800 py-20 text-center"><ImageIcon size={32} className="mx-auto text-zinc-600"/><p className="mt-3 font-medium">{query ? "No matching images" : "Your image library is empty"}</p><p className="mt-1 text-sm text-zinc-500">Upload an image or generate one to see it here.</p></div>}
    {viewerIndex !== null && viewerItems.length > 0 && <MediaViewer items={viewerItems} index={Math.min(viewerIndex, viewerItems.length - 1)} onClose={() => setViewerIndex(null)} onChange={setViewerIndex} getDownloadUrl={(item) => `${api.defaults.baseURL}/images/${encodeURIComponent(item.id)}/download`} />}
  </div>;
}
