import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export default function FileDropzone({ onFiles, accept = "image/*", multiple = true, disabled = false, label = "Choose files", description = "Drop files here or browse", className = "" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const receiveFiles = (fileList) => {
    const all = Array.from(fileList || []);
    const maxBytes = 20 * 1024 * 1024;
    const accepted = [];
    const rejected = [];
    for (const file of all) {
      const patterns = accept.split(",").map((part) => part.trim().toLowerCase());
      const typeAllowed = patterns.some((pattern) => pattern === "*/*" || (pattern.endsWith("/*") ? file.type.startsWith(pattern.slice(0, -1)) : file.type === pattern));
      if (!typeAllowed) rejected.push(`${file.name}: unsupported file type`);
      else if (file.size > maxBytes) rejected.push(`${file.name}: exceeds the 20 MB limit`);
      else accepted.push(file);
    }
    if (!multiple && accepted.length > 1) rejected.push("Only one file can be selected here.");
    onFiles?.(multiple ? accepted : accepted.slice(0, 1), rejected);
  };

  return <div className={`relative ${className}`} onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragOver={(event) => { event.preventDefault(); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!disabled) receiveFiles(event.dataTransfer.files); }}>
    <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition ${dragging ? "border-violet-400 bg-violet-500/15 text-white" : "border-zinc-700 text-zinc-300 hover:border-violet-500 hover:bg-violet-500/5"} disabled:cursor-not-allowed disabled:opacity-50`}><Upload size={16}/><span>{dragging ? "Drop files here" : label}</span></button>
    <p className="mt-1 text-center text-[10px] text-zinc-600">{description} · up to 20 MB per file</p>
    <input ref={inputRef} type="file" accept={accept} multiple={multiple} disabled={disabled} className="sr-only" onChange={(event) => { receiveFiles(event.target.files); event.target.value = ""; }}/>
  </div>;
}
