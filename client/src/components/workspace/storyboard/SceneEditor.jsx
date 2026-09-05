import { useEffect, useState } from "react";
import {
  X,
  Image as ImageIcon,
  Video,
  Save,
  User,
} from "lucide-react";

import CharacterSelector from "../characters/CharacterSelector";
import useCharacterStore from "@/stores/characters/characterStore";

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

  const [type, setType] = useState(
    scene?.type || "image",
  );

  const [prompt, setPrompt] = useState(
    scene?.prompt ||
      scene?.description ||
      "",
  );

  const [notes, setNotes] = useState(
    scene?.notes || "",
  );

  const [isSaving, setIsSaving] = useState(false);

  const [formError, setFormError] =
    useState("");

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

      type,

      prompt: trimmedPrompt,

      notes: trimmedNotes,

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

        {/* Generation Type */}
        <div>
          <label className="block mb-2 text-sm font-medium text-zinc-300">
            Generation Type
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("image")}
              disabled={isSaving}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition border rounded-xl ${
                type === "image"
                  ? "border-purple-500 bg-purple-500/10 text-purple-400"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-white hover:border-zinc-700"
              } disabled:opacity-60`}
            >
              <ImageIcon size={17} />
              Image
            </button>

            <button
              type="button"
              onClick={() => setType("video")}
              disabled={isSaving}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition border rounded-xl ${
                type === "video"
                  ? "border-purple-500 bg-purple-500/10 text-purple-400"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-white hover:border-zinc-700"
              } disabled:opacity-60`}
            >
              <Video size={17} />
              Video
            </button>
          </div>
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