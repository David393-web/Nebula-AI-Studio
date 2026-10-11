import { useEffect, useState } from "react";
import {
  X,
  Save,
  User,
} from "lucide-react";

import CharacterSelector from "../characters/CharacterSelector";
import useCharacterStore from "@/stores/characters/characterStore";
import api from "@/services/api";
import { getImages } from "@/services/media";
import FileDropzone from "@/components/media/FileDropzone";

export default function SceneEditor({
  scene,
  onSave,
  onClose,
}) {
  const selectedCharacter = useCharacterStore(
    (state) => state.selectedCharacter,
  );

  const selectCharacter = useCharacterStore(
    (state) => state.selectCharacter,
  );

  const clearCharacter = useCharacterStore(
    (state) => state.clearCharacter,
  );

  const [title, setTitle] = useState(
    scene?.title ||
      scene?.name ||
      "",
  );

  const [prompt, setPrompt] = useState(
    scene?.prompt ||
      scene?.description ||
      "",
  );

  const [notes, setNotes] = useState(
    scene?.notes || "",
  );
  const [durationSeconds, setDurationSeconds] = useState(Number(scene?.durationSeconds || scene?.metadata?.durationSeconds || 5));
  const [audioMode, setAudioMode] = useState(scene?.audioMode || scene?.metadata?.audioMode || "inherit");
  const [audioPrompt, setAudioPrompt] = useState(scene?.audioPrompt || scene?.metadata?.audioPrompt || "");
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState("");
  const [imageId, setImageId] = useState(scene?.imageId || scene?.metadata?.imageId || "");

  const [isSaving, setIsSaving] = useState(false);

  const [formError, setFormError] =
    useState("");

  useEffect(() => { getImages().then((rows) => {
    setImages(rows);
    setImageId((current) => current || rows.find((row) => row.url === scene?.imageUrl)?.id || "");
  }).catch(() => {}); }, [scene?.id, scene?.imageUrl]);

  const handleImageUpload = async (files, rejected = []) => {
    setFormError(rejected.join(" · ")); if (!files.length) return;
    setIsSaving(true); const imported = []; const failures = [];
    for (const [index, file] of files.entries()) {
      setUploadProgress(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
      try {
        const form = new FormData(); form.append("file", file);
        const { data } = await api.post("/storage/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
        const image = data?.data?.image;
        if (!image?.id) throw new Error("The image was uploaded but could not be added to the library.");
        imported.push(image);
      } catch (error) { failures.push(`${file.name}: ${error.response?.data?.message || error.message || "Upload failed"}`); }
    }
    if (imported.length) { setImages((current) => [...imported, ...current]); setImageId(imported[0].id); }
    setFormError([rejected.join(" · "), failures.join(" · ")].filter(Boolean).join(" · "));
    setUploadProgress(""); setIsSaving(false);
  };

  /*
   * When editing an existing scene,
   * restore its character into the
   * shared character selection.
   */
  useEffect(() => {
    if (scene?.character) {
      selectCharacter(scene.character);
    } else {
      clearCharacter();
    }
  }, [
    scene,
    selectCharacter,
    clearCharacter,
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedPrompt = prompt.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedTitle && !trimmedPrompt) {
      setFormError(
        "Add a scene title or generation prompt.",
      );
      return;
    }

    if (!onSave) {
      return;
    }

    setFormError("");
    setIsSaving(true);

    const sceneData = {
      ...(scene || {}),

      /*
       * Do NOT create an ID here.
       * The backend creates the ID for new scenes.
       */
      title:
        trimmedTitle || "Untitled Scene",

      type: "image",

      prompt: trimmedPrompt,

      notes: trimmedNotes,

      durationSeconds: Math.min(15, Math.max(2, Number(durationSeconds) || 5)),
      audioMode,
      audioPrompt: audioPrompt.trim(),

      imageId: imageId || null,

      imageUrl: images.find((image) => image.id === imageId)?.url || (imageId ? null : scene?.imageUrl || null),

      character:
        selectedCharacter || null,
    };

    try {
      await onSave(sceneData);
    } catch (error) {
      console.error(
        "Failed to save scene:",
        error,
      );

      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save scene. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    setFormError("");
    onClose?.();
  };

  return (
    <div className="border rounded-2xl border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <h3 className="font-semibold text-white">
            {scene
              ? "Edit Scene"
              : "Create Scene"}
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            Configure how this scene should be generated.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="flex items-center justify-center w-8 h-8 transition rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
            aria-label="Close scene editor"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="p-5 space-y-5"
      >
        {/* Error */}
        {formError && (
          <div className="px-4 py-3 text-sm text-red-300 border rounded-xl border-red-500/20 bg-red-500/10">
            {formError}
          </div>
        )}

        {/* Scene Title */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-300">Scene audio
            <select value={audioMode} onChange={(event) => setAudioMode(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white">
              <option value="inherit">Use Video Studio setting</option><option value="audio">AI Audio</option><option value="silent">No Audio</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-300">Voice &amp; Audio Instructions
            <textarea value={audioPrompt} onChange={(event) => setAudioPrompt(event.target.value)} maxLength={3000} rows={2} placeholder="Dialogue, narration, voice, music, or ambience…" className="mt-2 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-white outline-none focus:border-violet-500" />
          </label>
        </div>

        {/* Scene Title */}
        <div>
          <label
            htmlFor="scene-title"
            className="block mb-2 text-sm font-medium text-zinc-300"
          >
            Scene Title
          </label>

          <input
            id="scene-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="e.g. Opening Shot"
            disabled={isSaving}
            className="w-full px-4 py-3 text-sm text-white transition border outline-none placeholder-zinc-600 rounded-xl bg-zinc-950 border-zinc-800 focus:border-purple-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="scene-duration" className="mb-2 block text-sm font-medium text-zinc-300">Scene video length</label>
          <select id="scene-duration" value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))} disabled={isSaving} className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white">
            {Array.from({ length: 14 }, (_, index) => index + 2).map((seconds) => <option key={seconds} value={seconds}>{seconds} seconds</option>)}
          </select>
          <p className="mt-1 text-xs text-zinc-600">Video clips support 2–15 seconds per scene.</p>
        </div>

        {/* Character */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User
              size={15}
              className="text-purple-400"
            />

            <label className="text-sm font-medium text-zinc-300">
              Character
            </label>
          </div>

          <CharacterSelector />
        </div>

        <div>
          <label htmlFor="scene-source-image" className="mb-2 block text-sm font-medium text-zinc-300">Scene image <span className="font-normal text-zinc-600">Optional</span></label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select id="scene-source-image" value={imageId} onChange={(event) => setImageId(event.target.value)} disabled={isSaving} className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white">
              <option value="">No image selected</option>
              {images.map((image) => <option key={image.id} value={image.id}>{image.name || "Untitled image"}</option>)}
            </select>
            <FileDropzone onFiles={handleImageUpload} label="Upload scene images" description="Drop one or more scene images" disabled={isSaving} />
            {uploadProgress && <p role="status" className="mt-1 text-[10px] text-violet-300">{uploadProgress}</p>}
          </div>
          {imageId && images.find((image) => image.id === imageId)?.url && <img src={images.find((image) => image.id === imageId)?.thumbnailUrl || images.find((image) => image.id === imageId)?.url} alt="Selected scene reference" className="mt-3 max-h-48 rounded-lg border border-zinc-800 object-contain"/>}
        </div>

        {/* Generation Prompt */}
        <div>
          <label
            htmlFor="scene-prompt"
            className="block mb-2 text-sm font-medium text-zinc-300"
          >
            Generation Prompt
          </label>

          <textarea
            id="scene-prompt"
            value={prompt}
            onChange={(event) =>
              setPrompt(event.target.value)
            }
            placeholder="Describe exactly what you want to generate for this scene..."
            rows={5}
            disabled={isSaving}
            className="w-full px-4 py-3 text-sm leading-6 text-white transition border outline-none resize-none placeholder-zinc-600 rounded-xl bg-zinc-950 border-zinc-800 focus:border-purple-500 disabled:opacity-60"
          />

          <div className="mt-1 text-xs text-right text-zinc-600">
            {prompt.length} characters
          </div>
        </div>

        {/* Generation Notes */}
        <div>
          <label
            htmlFor="scene-notes"
            className="block mb-2 text-sm font-medium text-zinc-300"
          >
            Generation Notes
            <span className="ml-1 font-normal text-zinc-600">
              Optional
            </span>
          </label>

          <textarea
            id="scene-notes"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Add visual direction, lighting, camera angle, mood, or consistency notes..."
            rows={3}
            disabled={isSaving}
            className="w-full px-4 py-3 text-sm leading-6 text-white transition border outline-none resize-none placeholder-zinc-600 rounded-xl bg-zinc-950 border-zinc-800 focus:border-purple-500 disabled:opacity-60"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium transition rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={
              isSaving ||
              (!title.trim() &&
                !prompt.trim())
            }
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />

            {isSaving
              ? "Saving..."
              : "Save Scene"}
          </button>
        </div>
      </form>
    </div>
  );
}
