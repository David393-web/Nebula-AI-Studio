import { useState } from "react";
import MediaViewer from "@/components/media/MediaViewer";
import { Download, Image as ImageIcon, Maximize2, Play } from "lucide-react";

export default function GenerationPreview({ result = null, downloadUrl = null, type = "image", loading = false, sourceLabel = "Your generated result", details = null }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const MediaIcon = type === "video" ? Play : ImageIcon;

  return <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 md:flex md:min-h-[480px] md:flex-col">
    <header className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex min-w-0 items-center gap-2.5"><span className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><MediaIcon size={17}/></span><div className="min-w-0"><h3 className="text-sm font-semibold text-white">Preview</h3><p className="truncate text-[10px] text-zinc-500 sm:text-xs">{sourceLabel}</p></div></div>
      {result && <div className="flex shrink-0 items-center gap-1.5"><button type="button" onClick={() => setViewerOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-xs font-medium text-zinc-300 hover:text-white" title="Expand preview"><Maximize2 size={15}/><span className="hidden min-[380px]:inline">Expand</span></button><a href={downloadUrl || result} className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-xs font-medium text-zinc-300 hover:text-white" title="Download"><Download size={15}/><span className="hidden min-[380px]:inline">Save</span></a></div>}
    </header>

    <div className="p-3 sm:p-4 md:flex md:flex-1 md:flex-col md:justify-center md:p-5">
      <div className="relative mx-auto flex aspect-[4/3] max-h-[66dvh] min-h-[220px] w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black sm:aspect-video sm:min-h-[280px] md:aspect-[16/10] md:min-h-[360px]">
        {loading ? <div className="flex flex-col items-center px-5 text-center"><span className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400"/><p className="mt-4 text-sm font-medium text-zinc-200">Creating your {type}…</p><p className="mt-1 text-xs text-zinc-500">Your result will appear here.</p></div> : result ? type === "video" ? <video src={result} controls playsInline preload="metadata" className="h-full w-full object-contain"/> : <button type="button" onClick={() => setViewerOpen(true)} className="h-full w-full cursor-zoom-in" aria-label="Open image preview"><img src={result} alt="Generated result" className="h-full w-full object-contain"/></button> : <div className="max-w-xs px-5 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-600"><MediaIcon size={25}/></span><h4 className="mt-4 text-sm font-medium text-zinc-200">Nothing generated yet</h4><p className="mt-1.5 text-xs leading-5 text-zinc-500">Your {type} will appear here when it’s ready.</p></div>}
      </div>
      {result && <p className="mt-2 text-center text-[10px] text-zinc-600">Tap the preview to view it full screen</p>}
    </div>

    {result && details && <details className="border-t border-zinc-800 px-4 py-3 sm:px-5"><summary className="min-h-8 cursor-pointer py-1 text-xs font-medium text-zinc-400">Generation details</summary><dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(details).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[10px] capitalize text-zinc-600">{label}</dt><dd className="truncate text-xs text-zinc-300">{String(value)}</dd></div>)}</dl></details>}
    {viewerOpen && result && <MediaViewer items={[{ id: "generation-preview", url: result, type, name: "Generated preview" }]} index={0} onClose={() => setViewerOpen(false)} onChange={() => {}}/>}
  </section>;
}
