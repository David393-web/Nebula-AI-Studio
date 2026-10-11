import {
  Clapperboard,
  Pencil,
  Trash2,
  Sparkles,
  User,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import SceneScriptEditor from "./SceneScriptEditor";
import { getSceneCharacters } from "@/utils/sceneScript";

export default function SceneCard({
  scene,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onClearGeneration,
  onSelect,
  onGenerate,
  onSaveScript,
  characters = [],
  selected = false,
}) {
  const generatedUrl =
    scene?.generatedUrl ||
    scene?.generatedImageUrl ||
    scene?.generatedVideoUrl ||
    null;

  const generatedType =
    scene?.generatedType ||
    (scene?.generatedVideoUrl ? "video" : null) ||
    (scene?.generatedImageUrl ? "image" : null) ||
    scene?.type ||
    "image";

  const sceneImage =
    scene?.imageUrl ||
    scene?.image ||
    null;
  const scriptSummary = (scene?.metadata?.sceneScript?.blocks || [])
    .find((block) => block.type !== "character" && block.text?.trim())?.text?.trim()
    || (scene?.metadata?.sceneScript?.blocks || []).find((block) => block.characterName)?.characterName;
  const sceneCharacterCount = getSceneCharacters(scene, characters).length;
  const scriptBlockCount = scene?.metadata?.sceneScript?.blocks?.length || 0;

  const hasGeneration = Boolean(generatedUrl);
  const uploadStatus = scene?.metadata?.uploadStatus;

  const characterImage =
    scene?.character?.image ||
    scene?.character?.imageUrl ||
    null;

  const handleDelete = (event) => {
    event.stopPropagation();

    if (!scene?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${scene?.title || `Scene ${index + 1}`}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    onDelete?.(scene.id);
  };

  const handleGenerate = (event) => {
    event.stopPropagation();
    onGenerate?.(scene);
  };

  const handleClearGeneration = (event) => {
    event.stopPropagation();

    if (!scene?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Remove this generated image? The storyboard scene and its prompt will be kept.",
    );

    if (confirmed) {
      onClearGeneration?.(scene.id);
    }
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    onEdit?.(scene);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition ${
        selected
          ? "border-purple-500 bg-purple-500/5"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      {/* Scene Preview */}
      <button
        type="button"
        onClick={() => onSelect?.(scene)}
        className="block w-full text-left"
        aria-label={`Select ${
          scene?.title || `Scene ${index + 1}`
        }`}
      >
        <div className="relative overflow-hidden aspect-video bg-zinc-950">
          {hasGeneration && generatedType === "video" ? (
            <video
              src={generatedUrl}
              className="object-cover w-full h-full"
              muted
              playsInline
              controls
              preload="metadata"
            />
          ) : hasGeneration ? (
            <img
              src={generatedUrl}
              alt={
                scene?.title ||
                `Scene ${index + 1}`
              }
              className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : sceneImage ? (
            <img
              src={sceneImage}
              alt={
                scene?.title ||
                `Scene ${index + 1}`
              }
              className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-zinc-600">
              <Clapperboard size={30} />

              <span className="mt-2 text-xs">
                No generation yet
              </span>
            </div>
          )}

          {/* Scene Number */}
          <div className="absolute flex items-center justify-center w-8 h-8 text-xs font-semibold text-white rounded-lg top-3 left-3 bg-black/70 backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Generation Type */}
          {hasGeneration && (
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-white uppercase rounded-lg bg-black/70 backdrop-blur-sm">
                {generatedType === "video" ? (
                  <Video size={12} />
                ) : (
                  <ImageIcon size={12} />
                )}

                {generatedType}
              </span>
            </div>
          )}

          {/* Generated Badge */}
          {hasGeneration && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 text-[10px] font-medium text-green-300 rounded-md bg-green-500/20 backdrop-blur-sm">
                Generated
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Scene Information */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">
              {scene?.title ||
                scene?.name ||
                `Scene ${index + 1}`}
            </h3>

            <p className="mt-1 text-xs leading-5 text-zinc-500 line-clamp-2">
              {scene?.prompt ||
                scene?.description ||
                scriptSummary ||
                "No scene prompt added yet."}
            </p>
          </div>

          {/* Edit */}
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center justify-center flex-shrink-0 w-8 h-8 transition rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
            aria-label={`Edit ${
              scene?.title || "scene"
            }`}
          >
            <Pencil size={15} />
          </button>
        </div>

        {/* Character */}
        {scene?.character && (
          <div className="flex items-center gap-2 px-3 py-2 mt-4 border rounded-lg border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-center flex-shrink-0 overflow-hidden rounded-md w-7 h-7 bg-purple-500/10">
              {characterImage ? (
                <img
                  src={characterImage}
                  alt={
                    scene.character.name ||
                    "Character"
                  }
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              ) : (
                <User
                  size={14}
                  className="text-purple-400"
                />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wide">
                Character
              </p>

              <p className="text-xs font-medium text-purple-400 truncate">
                {scene.character.name ||
                  "Unnamed Character"}
              </p>
            </div>
          </div>
        )}

        {onDuplicate && <button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(scene); }} className="mt-3 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800">Duplicate scene</button>}

        <SceneScriptEditor scene={scene} index={index} characters={characters} onSave={onSaveScript} onEditScene={onEdit} />

        {/* Generation Status */}
        <div className="flex items-center gap-2 mt-4">
          <span
            className={`w-2 h-2 rounded-full ${
              hasGeneration
                ? "bg-green-400"
                : "bg-zinc-600"
            }`}
          />

          <span className="text-xs text-zinc-500">
            {uploadStatus === "Uploading" ? "Uploading" : uploadStatus === "Failed" ? "Failed" : hasGeneration ? "Completed" : "Waiting"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-500">
          <span className="rounded-full bg-zinc-950 px-2.5 py-1">{sceneCharacterCount} {sceneCharacterCount === 1 ? "character" : "characters"}</span>
          <span className="rounded-full bg-zinc-950 px-2.5 py-1">{scriptBlockCount ? `${scriptBlockCount} script blocks` : "No script"}</span>
          <span className={`rounded-full px-2.5 py-1 ${hasGeneration ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-950"}`}>{hasGeneration ? "Generated" : "Not generated"}</span>
        </div>

        {/* Scene Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-zinc-800">
          <span className="text-xs capitalize text-zinc-600">
            {(scene?.type || "image") + " · " + (scene?.durationSeconds || 5) + "s"}
          </span>

          <div className="flex items-center gap-2">
            {/* Generate */}
            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-400 transition rounded-lg bg-purple-500/10 hover:bg-purple-500/20 hover:text-purple-300"
            >
              <Sparkles size={13} />

              {hasGeneration
                ? "Regenerate"
                : "Generate"}
            </button>

            {hasGeneration && (
              <button
                type="button"
                onClick={handleClearGeneration}
                className="flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-amber-400"
              >
                <Trash2 size={14} />
                Remove image
              </button>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-red-400"
            >
              <Trash2 size={14} />
              Delete scene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
