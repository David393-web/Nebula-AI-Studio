import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { formatSceneScriptPrompt, normalizeSceneScript } from "@/utils/sceneScript";

const labels = { character: "Character", action: "Action", dialogue: "Dialogue", narration: "Narration", camera: "Camera direction", audio: "Audio direction" };

export default function SceneScriptEditor({ scene, index, characters = [], onSave, onEditScene }) {
  const [expanded, setExpanded] = useState(false);
  const [script, setScript] = useState(() => normalizeSceneScript(scene?.metadata?.sceneScript));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addBlock = (type) => setScript((current) => ({ ...current, blocks: [...current.blocks, { id: crypto.randomUUID(), type, characterId: "", characterName: "", text: "" }] }));
  const updateBlock = (id, updates) => setScript((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === id ? { ...block, ...updates } : block) }));
  const moveBlock = (id, delta) => setScript((current) => {
    const blocks = [...current.blocks]; const at = blocks.findIndex((block) => block.id === id); const to = at + delta;
    if (at < 0 || to < 0 || to >= blocks.length) return current;
    [blocks[at], blocks[to]] = [blocks[to], blocks[at]]; return { ...current, blocks };
  });
  const save = async () => {
    setSaving(true); setError("");
    try {
      await onSave?.(scene.id, script);
      setExpanded(false);
    }
    catch (cause) { setError(cause.response?.data?.message || cause.message || "Could not save this scene script."); }
    finally { setSaving(false); }
  };

  const image = scene?.imageUrl || scene?.image || scene?.generatedUrl || scene?.generatedImageUrl || "";
  const imageNumber = image ? String(index + 1).padStart(2, "0") : "Not assigned";
  return <section className="mt-4 border-t border-zinc-800 pt-3" onClick={(event) => event.stopPropagation()}>
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-violet-300 hover:bg-zinc-800/70">
      <span>Script <span className="ml-2 text-xs text-zinc-500">{script.blocks.length} blocks</span></span><span>{expanded ? "−" : "+"}</span>
    </button>
    <div hidden={!expanded} className="space-y-4 px-2 pb-2 pt-3">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-950 px-3 py-2 text-xs"><span className="font-semibold tracking-wide text-zinc-300">SCENE {String(index + 1).padStart(2, "0")}</span><span className="text-zinc-500">IMAGE: {imageNumber}</span></div>
      {!image && <button type="button" onClick={() => onEditScene?.(scene)} className="text-xs text-violet-300 hover:text-violet-200">Select or add a scene image</button>}
      {script.blocks.map((block, at) => <div key={block.id} className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
        <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{labels[block.type]}</span><div className="flex gap-1"><button type="button" aria-label="Move block up" disabled={at === 0} onClick={() => moveBlock(block.id, -1)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 disabled:opacity-30"><ArrowUp size={14}/></button><button type="button" aria-label="Move block down" disabled={at === script.blocks.length - 1} onClick={() => moveBlock(block.id, 1)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 disabled:opacity-30"><ArrowDown size={14}/></button><button type="button" aria-label="Delete block" onClick={() => setScript((current) => ({ ...current, blocks: current.blocks.filter((item) => item.id !== block.id) }))} className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14}/></button></div></div>
        {["character", "action", "dialogue"].includes(block.type) && <><select value={block.characterId} onChange={(event) => { const selected = characters.find((item) => item.id === event.target.value); updateBlock(block.id, { characterId: selected?.id || "", characterName: selected?.name || "" }); }} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"><option value="">Select a character (optional)</option>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select>{!characters.length || !block.characterId ? <input value={block.characterName} onChange={(event) => updateBlock(block.id, { characterName: event.target.value })} placeholder="Character name" className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"/> : null}</>}
        {block.type === "character" ? <p className="text-xs text-zinc-500">Character reference for this scene.</p> : <textarea value={block.text} onChange={(event) => updateBlock(block.id, { text: event.target.value })} rows={block.type === "dialogue" || block.type === "narration" ? 3 : 2} placeholder={`Write ${labels[block.type].toLowerCase()}…`} className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"/>}
      </div>)}
      <div className="flex flex-wrap gap-2">{[["character", "Add Character"], ["dialogue", "Add Dialogue"], ["action", "Add Action"], ["narration", "Add Narration"], ["camera", "Add Camera Direction"], ["audio", "Add Audio Direction"]].map(([type, label]) => <button key={type} type="button" onClick={() => addBlock(type)} className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:border-violet-500/50 hover:text-white"><Plus size={12}/>{label}</button>)}</div>
      <div className="flex items-center justify-between gap-3"><span className="text-[11px] text-zinc-600">Saved separately with this scene.</span><button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"><Save size={14}/>{saving ? "Saving…" : "Save Script"}</button></div>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      <details className="text-[11px] text-zinc-600"><summary className="cursor-pointer">Generation prompt preview</summary><pre className="mt-2 whitespace-pre-wrap rounded bg-black/30 p-2">{formatSceneScriptPrompt(script) || "No script blocks yet."}</pre></details>
    </div>
  </section>;
}
