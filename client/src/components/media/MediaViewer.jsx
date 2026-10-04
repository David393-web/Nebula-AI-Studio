import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, Maximize, Minus, Plus, RotateCcw, X } from "lucide-react";

export default function MediaViewer({ items, index, onClose, onChange, getDownloadUrl, onUseAsInput }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const mediaRef = useRef(null);
  const item = items[index];
  const isVideo = item?.type === "video";
  const source = item?.url;

  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, [index, source]);
  useEffect(() => {
    if (!item) return undefined;
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && index > 0) onChange(index - 1);
      if (event.key === "ArrowRight" && index < items.length - 1) onChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [item, index, items.length, onClose, onChange]);

  if (!item) return null;
  const downloadUrl = getDownloadUrl?.(item) || source;
  const zoomAt = (value) => setScale(Math.max(0.25, Math.min(5, value)));
  const toggleFullscreen = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else mediaRef.current?.requestFullscreen?.(); };

  return createPortal(<div className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label={isVideo ? "Video viewer" : "Image viewer"} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <header className="flex min-h-14 shrink-0 items-center justify-between border-b border-white/10 px-3 sm:px-5"><div className="flex min-w-0 items-center gap-3">{index > 0 && <button onClick={() => onChange(index - 1)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Previous media"><ChevronLeft size={20}/></button>}<p className="truncate text-sm text-zinc-200">{item.name || item.prompt || (isVideo ? "Video" : "Image")}</p>{index < items.length - 1 && <button onClick={() => onChange(index + 1)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Next media"><ChevronRight size={20}/></button>}</div><div className="flex shrink-0 items-center gap-1">
      {!isVideo && <><button onClick={() => zoomAt(scale - 0.25)} className="rounded-lg p-2 hover:bg-white/10" title="Zoom out" aria-label="Zoom out"><Minus size={18}/></button><span className="min-w-12 text-center text-xs text-zinc-400">{Math.round(scale * 100)}%</span><button onClick={() => zoomAt(scale + 0.25)} className="rounded-lg p-2 hover:bg-white/10" title="Zoom in" aria-label="Zoom in"><Plus size={18}/></button><button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="rounded-lg p-2 hover:bg-white/10" title="Reset zoom" aria-label="Reset zoom"><RotateCcw size={16}/></button></>}
      <button onClick={toggleFullscreen} className="rounded-lg p-2 hover:bg-white/10" title="Fullscreen" aria-label="Fullscreen"><Maximize size={17}/></button><a href={downloadUrl} download className="rounded-lg p-2 hover:bg-white/10" aria-label="Download"><Download size={17}/></a>{onUseAsInput && !isVideo && <button onClick={() => onUseAsInput(item)} className="rounded-lg px-3 py-2 text-xs hover:bg-white/10">Use as input</button>}<button onClick={onClose} className="ml-1 rounded-lg p-2 hover:bg-white/10" aria-label="Close viewer"><X size={20}/></button></div></header>
    <main ref={mediaRef} className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden p-2 sm:p-8" onWheel={(event) => { if (!isVideo) { event.preventDefault(); zoomAt(scale * (event.deltaY < 0 ? 1.12 : 0.89)); } }} onPointerDown={(event) => { if (!isVideo && scale > 1) { event.currentTarget.setPointerCapture(event.pointerId); setDrag({ x: event.clientX, y: event.clientY }); } }} onPointerMove={(event) => { if (drag) { setOffset((old) => ({ x: old.x + event.clientX - drag.x, y: old.y + event.clientY - drag.y })); setDrag({ x: event.clientX, y: event.clientY }); } }} onPointerUp={() => setDrag(null)}>
      {isVideo ? <video src={source} poster={item.thumbnailUrl || undefined} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg object-contain"/> : <img src={source} alt={item.name || "Expanded image"} draggable="false" className="max-h-full max-w-full select-none object-contain" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, cursor: scale > 1 ? drag ? "grabbing" : "grab" : "zoom-in" }} onDoubleClick={() => zoomAt(scale === 1 ? 2 : 1)}/>}
    </main>
    <footer className="flex min-h-11 shrink-0 items-center justify-center gap-3 border-t border-white/10 text-xs text-zinc-500">{items.length > 1 ? `${index + 1} / ${items.length} · use ← → to browse` : ""}{!isVideo && <span>· Scroll to zoom</span>}</footer>
  </div>, document.body);
}
