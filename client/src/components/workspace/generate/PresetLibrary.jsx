import { useEffect, useMemo, useState } from "react";
import { Copy, Heart, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";

const STARTERS = {
  image: [
    ["Photorealistic Portrait", "Portrait", "Photorealistic editorial portrait, natural skin texture, soft directional studio light, refined composition."],
    ["Cinematic Concept Art", "Concept Art", "Cinematic environment concept art, atmospheric depth, deliberate color palette, dramatic but readable composition."],
    ["Product Advertisement", "Product", "Premium product advertising image, clear product silhouette, polished commercial lighting, generous negative space."],
    ["Fantasy Illustration", "Illustration", "Original fantasy illustration with expressive shapes, layered detail, evocative lighting, and a distinctive palette."],
    ["Character Reference", "Character", "Character reference portrait with a clear face, neutral background, readable clothing details, and consistent proportions."],
    ["Social Media Creative", "Social", "Bold social media visual with one clear focal point, strong color contrast, and space for a headline to be added later."],
  ],
  video: [
    ["Cinematic Scene", "Cinematic", "A cinematic scene with restrained camera movement, layered atmosphere, natural motion, and a clear visual beat."],
    ["Product Showcase", "Product", "A refined product showcase with a slow controlled camera move, crisp material detail, and premium studio lighting."],
    ["Character Animation", "Character", "Animate the referenced character with a simple readable action, natural timing, and a stable identity."],
    ["Science-Fiction Action", "Cinematic", "A science-fiction action beat with purposeful motion, atmospheric light, and a clear beginning and ending pose."],
    ["Smooth Camera Movement", "Cinematic", "A smooth continuous camera move that reveals the scene gradually while keeping the main subject readable."],
    ["Storyboard Scene", "Cinematic", "Bring the storyboard scene to life with subtle environmental motion, coherent staging, and a purposeful camera move."],
  ],
};

export default function PresetLibrary({ type, current, onApply }) {
  const [presets, setPresets] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("Custom");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({});

  const load = async () => { try { const response = await api.get("/generation/presets"); setPresets(response.data?.data?.presets || []); } catch (error) { toast.error(error.response?.data?.message || "Could not load saved presets."); } };
  useEffect(() => { load(); }, []);
  const starters = STARTERS[type].map(([title, group, prompt]) => ({ id: `starter-${type}-${title}`, name: title, category: group, type, starter: true, settings: { prompt, modelId: "auto", ratio: "1:1", quality: type === "image" ? "High" : "720P", duration: "5", audio: true } }));
  const rows = useMemo(() => [...starters, ...presets.filter((preset) => preset.type === type)].filter((preset) => (!search || `${preset.name} ${preset.category} ${preset.settings?.prompt}`.toLowerCase().includes(search.toLowerCase())) && (category === "All categories" || preset.category === category)), [starters, presets, type, search, category]);
  const categories = [...new Set([...starters, ...presets.filter((preset) => preset.type === type)].map((preset) => preset.category))];

  const apply = (preset) => { onApply(preset.settings); setOpen(false); toast.success(`${preset.name} applied. Review the form, then choose Generate when ready.`); };
  const startSave = (preset = null) => {
    setEditing(preset || false); setName(preset?.name || ""); setCategoryName(preset?.category || "Custom");
    if (preset) setSettingsDraft({ ...preset.settings });
    else { const draft = { ...current }; delete draft.referenceImages; setSettingsDraft(draft); }
  };
  const save = async (event) => {
    event.preventDefault(); setLoading(true);
    try {
      let referenceImageIds = settingsDraft.referenceImageIds || [];
      if (!editing) {
        referenceImageIds = [...new Set(current.referenceImages?.map((item) => item.assetId).filter(Boolean) || [])];
        for (const reference of current.referenceImages || []) {
          if (!reference.assetId && reference.file) {
            const form = new FormData(); form.append("file", reference.file);
            const upload = await api.post("/storage/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
            const id = upload.data?.data?.image?.id; if (id) referenceImageIds.push(id);
          }
        }
      }
      const presetSettings = { ...settingsDraft, prompt: settingsDraft.prompt || "", referenceImageIds, modelId: settingsDraft.modelId || "auto" };
      if (type === "image") { delete presetSettings.duration; delete presetSettings.audio; }
      else if (presetSettings.duration != null) presetSettings.duration = Number(presetSettings.duration);
      const payload = { name, type, category: categoryName, settings: presetSettings };
      if (editing) await api.patch(`/generation/presets/${editing.id}`, payload); else await api.post("/generation/presets", payload);
      setEditing(null); setName(""); await load(); toast.success(editing ? "Preset updated." : "Preset saved.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not save preset."); }
    finally { setLoading(false); }
  };
  const duplicate = async (preset) => { try { await api.post("/generation/presets", { name: `${preset.name} copy`.slice(0, 80), type, category: preset.category, settings: preset.settings }); await load(); toast.success("Preset duplicated."); } catch { toast.error("Could not duplicate preset."); } };
  const remove = async (preset) => { if (!window.confirm(`Delete “${preset.name}”?`)) return; try { await api.delete(`/generation/presets/${preset.id}`); await load(); toast.success("Preset deleted."); } catch { toast.error("Could not delete preset."); } };
  const favorite = async (preset) => { try { await api.patch(`/generation/presets/${preset.id}`, { favorite: !preset.favorite }); await load(); } catch { toast.error("Could not update favorite."); } };

  return <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-medium text-white"><Sparkles size={15} className="text-violet-300"/>Presets</h3><p className="mt-1 text-xs text-zinc-500">Reusable prompts and settings. Applying one never starts generation.</p></div><div className="flex gap-2"><button type="button" onClick={() => setOpen(!open)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-white hover:border-violet-500">{open ? "Hide presets" : "Browse presets"}</button><button type="button" onClick={() => startSave()} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500"><Plus size={14}/>Save preset</button></div></div>
    {open && <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4"><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><label className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3"><Search size={14} className="text-zinc-500"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search presets" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white outline-none"/></label><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="grid gap-2 sm:grid-cols-2">{rows.map((preset) => <article key={preset.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><div className="flex items-start justify-between gap-2"><div><h4 className="text-xs font-medium text-white">{preset.name}</h4><p className="mt-1 text-[10px] text-violet-300">{preset.starter ? "Starter preset" : preset.category}</p></div>{!preset.starter && <div className="flex gap-1">{[[Heart, () => favorite(preset), preset.favorite ? "text-pink-300" : "text-zinc-500", "Favorite"], [Pencil, () => startSave(preset), "text-zinc-500", "Edit"], [Copy, () => duplicate(preset), "text-zinc-500", "Duplicate"], [Trash2, () => remove(preset), "text-zinc-500", "Delete"]].map(([Icon, action, color, label]) => <button type="button" key={label} onClick={action} title={label} aria-label={`${label} ${preset.name}`} className={`rounded p-1 hover:bg-zinc-800 ${color}`}><Icon size={13}/></button>)}</div>}</div><p className="mt-2 line-clamp-2 text-[10px] leading-4 text-zinc-500">{preset.settings?.prompt}</p><button type="button" onClick={() => apply(preset)} className="mt-3 w-full rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-200 hover:bg-violet-500/20">Apply to form</button></article>)}{rows.length === 0 && <p className="col-span-full py-6 text-center text-xs text-zinc-500">No presets match this search.</p>}</div></div>}
    {editing !== null && <div role="dialog" aria-modal="true" aria-label={editing ? "Edit preset" : "Save preset"} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"><form onSubmit={save} className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5"><div><h3 className="text-base font-semibold text-white">{editing ? "Edit preset" : "Save current setup"}</h3><p className="mt-1 text-xs text-zinc-500">Edit the reusable prompt and settings saved to your account.</p></div><label className="block text-xs text-zinc-400">Name<input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"/></label><label className="block text-xs text-zinc-400">Prompt<textarea required maxLength={15000} rows={5} value={settingsDraft.prompt || ""} onChange={(e) => setSettingsDraft((value) => ({ ...value, prompt: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"/></label><label className="block text-xs text-zinc-400">Model<select value={settingsDraft.modelId || "auto"} onChange={(e) => setSettingsDraft((value) => ({ ...value, modelId: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white"><option value="auto">Auto</option>{current.modelId && current.modelId !== "auto" && <option value={current.modelId}>{current.modelId}</option>}</select></label>{type === "image" ? <><label className="block text-xs text-zinc-400">Aspect ratio<select value={settingsDraft.ratio || "1:1"} onChange={(e) => setSettingsDraft((value) => ({ ...value, ratio: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white">{["1:1", "16:9", "9:16", "4:3", "3:4"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-xs text-zinc-400">Quality<select value={settingsDraft.quality || "High"} onChange={(e) => setSettingsDraft((value) => ({ ...value, quality: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white">{["Standard", "High", "Ultra"].map((value) => <option key={value}>{value}</option>)}</select></label></> : <><label className="block text-xs text-zinc-400">Resolution<select value={settingsDraft.quality || "720P"} onChange={(e) => setSettingsDraft((value) => ({ ...value, quality: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white">{["720P", "1080P"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-xs text-zinc-400">Duration<input type="number" min="2" max="15" value={settingsDraft.duration || 5} onChange={(e) => setSettingsDraft((value) => ({ ...value, duration: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white"/></label><label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={settingsDraft.audio !== false} onChange={(e) => setSettingsDraft((value) => ({ ...value, audio: e.target.checked }))}/>Generate audio when supported</label></>}<label className="block text-xs text-zinc-400">Category<select value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white">{["Custom", "Portrait", "Concept Art", "Product", "Illustration", "Character", "Social", "Cinematic"].map((item) => <option key={item}>{item}</option>)}</select></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-xs text-zinc-400">Cancel</button><button disabled={loading} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50">{loading ? "Saving…" : "Save preset"}</button></div></form></div>}
  </div>;
}
