import { useEffect, useMemo, useState } from "react";
import { Image, Video, Sparkles } from "lucide-react";

import PromptBox from "./PromptBox";
import GenerationSettings from "./GenerationSettings";
import ReferenceImages from "./ReferenceImages";
import NegativePrompt from "./NegativePrompt";
import GenerationPreview from "./GenerationPreview";
import GenerationHistory from "./GenerationHistory";
import ModelSelector from "./ModelSelector";
import PresetLibrary from "./PresetLibrary";
import CharacterSelector from "../characters/CharacterSelector";
import ImageEditTools from "./ImageEditTools";
import VideoSettings from "@/components/workspace/video/VideoSettings";
import { buildVisualScenePrompt, getSceneCharacters } from "@/utils/sceneScript";

import { generateAIImage } from "@/api/generationApi";

import useGenerationStore from "@/stores/generation/generationStore";
import useCharacterStore from "@/stores/characters/characterStore";
import useAssetStore from "@/stores/assets/assetStore";
import api from "@/services/api";
import { clearPendingVideoGeneration, getPendingVideoGenerations, savePendingVideoGeneration, waitForVideoGeneration } from "@/utils/videoGenerationPolling";

export default function GeneratePanel({
  initialPrompt = "",
  initialType = "image",
  scene = null,
  projectId = null,
  characters = [],
  onSaveSceneCharacters,
  onGenerationComplete,
}) {
  const [type, setType] = useState(scene?.type || initialType || "image");
  const [modelCatalog, setModelCatalog] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState("auto");
  const [selectedModel, setSelectedModel] = useState(null);
  const [creditCosts, setCreditCosts] = useState(null);
  const [creditBalance, setCreditBalance] = useState(null);
  const [videoDuration, setVideoDuration] = useState(String(scene?.durationSeconds || 5));
  const [videoQuality, setVideoQuality] = useState("720P");
  const [videoAudioEnabled, setVideoAudioEnabled] = useState(scene?.audioMode === "silent" ? false : true);
  const [videoFrameMode, setVideoFrameMode] = useState("reference");

  const [prompt, setPrompt] = useState(scene?.prompt || initialPrompt || "");

  const [negativePrompt, setNegativePrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState([]);
  const [selectedSceneCharacters, setSelectedSceneCharacters] = useState(() => getSceneCharacters(scene, characters));
  const [sceneCharactersSaved, setSceneCharactersSaved] = useState(() => getSceneCharacters(scene, characters).length > 0);
  const [savingSceneCharacters, setSavingSceneCharacters] = useState(false);

  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(null);

  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [rejectedPrompt, setRejectedPrompt] = useState(null);

  const { model, ratio, quality } =
    useGenerationStore();

  const {
    selectedCharacter,
    selectCharacter,
    clearCharacter,
    loading: charactersLoading,
  } = useCharacterStore();

  const addAsset = useAssetStore(
    (state) => state.addAsset,
  );

  useEffect(() => {
    let active = true;
    const recover = async () => {
      const pendingIds = getPendingVideoGenerations();
      if (!pendingIds.length) return;
      setType("video");
      setLoading(true);
      try {
        for (const generationId of pendingIds) {
          if (!active) return;
          const abort = new AbortController();
          const video = await waitForVideoGeneration(api, generationId, (status) => {
            if ((status.projectId || null) !== (projectId || null) || (status.sceneId && status.sceneId !== scene?.id)) abort.abort();
            else setVideoProgress(status);
          }, { signal: abort.signal });
          if (!active) return;
          const recovered = { ...video, id: video.id, type: "video", createdAt: video.createdAt || new Date().toISOString() };
          setResult(recovered);
          setHistory((current) => [recovered, ...current.filter((item) => item.id !== recovered.id)]);
          addAsset(recovered);
          onGenerationComplete?.(recovered);
        }
      } catch (recoveryError) {
        if (active && recoveryError.message !== "Status checking was paused.") setError(recoveryError.response?.data?.message || recoveryError.message || "Could not check the saved generation status.");
      } finally {
        if (active) { setLoading(false); setVideoProgress(null); }
      }
    };
    void recover();
    return () => { active = false; };
  }, []);

  const sceneSourceImage = scene?.imageUrl || scene?.image || ((scene?.generatedType === "image" || (!scene?.generatedType && scene?.type !== "video")) ? scene?.generatedUrl || scene?.generatedImageUrl : null);
  const availableSceneCharacters = useMemo(() => characters.filter((character) => !character.projectId || character.projectId === (projectId || scene?.projectId)), [characters, projectId, scene?.projectId]);
  const sceneScript = scene?.sceneScript || scene?.metadata?.sceneScript || { version: 1, blocks: [] };
  const saveSceneCharacters = async (rows = selectedSceneCharacters) => {
    if (!scene?.id || !onSaveSceneCharacters) return;
    setSavingSceneCharacters(true);
    try {
      await onSaveSceneCharacters(scene.id, rows);
      setSelectedSceneCharacters(rows);
      setSceneCharactersSaved(rows.length > 0);
    } finally {
      setSavingSceneCharacters(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get(`/credits/costs?duration=${videoDuration}`)
      .then((response) => { if (active) setCreditCosts(response.data?.data?.costs || null); })
      .catch(() => {});
    api.get("/credits")
      .then((response) => { if (active) setCreditBalance(response.data?.data?.balance ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [videoDuration]);

  useEffect(() => {
    let active = true;
    api.get("/generation/models").then((response) => { if (active) setModelCatalog(response.data?.data?.models || []); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (selectedModel && selectedModel.type !== type) { setSelectedModel(null); setSelectedModelId("auto"); }
  }, [type, selectedModel]);

  const applyPreset = async (settings) => {
    setPrompt(settings.prompt || "");
    setNegativePrompt(settings.negativePrompt || "");
    if (Array.isArray(settings.referenceImageIds)) {
      const references = await Promise.all(settings.referenceImageIds.map(async (id) => {
        try { const response = await api.get(`/images/${encodeURIComponent(id)}`); const image = response.data?.data?.image; return image ? { id: image.id, assetId: image.id, url: image.url, preview: image.url, file: null } : null; }
        catch { return null; }
      }));
      setReferenceImages(references.filter(Boolean));
    } else setReferenceImages([]);
    if (!scene && type === "image" && settings.characterId) {
      const character = useCharacterStore.getState().characters.find((item) => item.id === settings.characterId);
      if (character) selectCharacter(character);
      else {
        try { const response = await api.get(`/characters/${encodeURIComponent(settings.characterId)}`); const owned = response.data?.data?.character; if (owned) selectCharacter(owned); else clearCharacter(); }
        catch { clearCharacter(); }
      }
    } else if (!scene && type === "image" && !settings.characterId) clearCharacter();
    if (settings.modelId === "auto" || !settings.modelId) { setSelectedModel(null); setSelectedModelId("auto"); }
    else {
      const candidate = modelCatalog.find((item) => item.id === settings.modelId && item.type === type && item.availability === "configured");
      setSelectedModel(candidate || null); setSelectedModelId(candidate?.id || "auto");
    }
    if (type === "image") {
      if (settings.ratio) useGenerationStore.getState().setRatio(settings.ratio);
      if (settings.quality) useGenerationStore.getState().setQuality(settings.quality);
    } else if (!scene) {
      if (settings.duration) setVideoDuration(String(settings.duration));
      if (typeof settings.audio === "boolean") setVideoAudioEnabled(settings.audio);
      if (settings.quality) setVideoQuality(settings.quality);
    }
  };

  const activeVideoCost = videoAudioEnabled ? creditCosts?.videoAudio : creditCosts?.videoSilent;
  const videoInsufficientCredits = type === "video" && Number.isFinite(creditBalance) && Number.isFinite(activeVideoCost) && creditBalance < activeVideoCost;

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) {
      return;
    }
    if (errorCode === "CONTENT_SAFETY_REJECTED" && rejectedPrompt === prompt.trim()) {
      setError("Please edit the scene description before trying again. Your story and saved scene script remain unchanged.");
      document.getElementById("generation-prompt")?.focus();
      return;
    }
    if (scene && type === "video" && !sceneSourceImage) {
      setError("Add or generate an image for this storyboard scene before creating its video.");
      return;
    }

    setLoading(true);
    setError("");
    setErrorCode("");

    try {
      if (scene && selectedSceneCharacters.length && !sceneCharactersSaved) await saveSceneCharacters();
      let generationResponse;
      const generationPrompt = buildVisualScenePrompt({
        title: scene?.title || scene?.name || "",
        direction: prompt.trim(),
        notes: scene?.notes || "",
        sceneScript: scene ? sceneScript : null,
        characters: scene ? selectedSceneCharacters : selectedCharacter ? [selectedCharacter] : [],
        referencePolicy: scene && sceneSourceImage
          ? "The storyboard reference defines the scene composition and environment. Character reference images define identity only."
          : (scene ? selectedSceneCharacters : selectedCharacter ? [selectedCharacter] : []).length
            ? "Attached character images are visual identity references only; do not reproduce their card, poster, labels or background."
            : "",
      });
      if (type === "image") {
        const referenceImageIds = [];
        if (!scene) for (const reference of referenceImages) {
          if (reference.assetId) referenceImageIds.push(reference.assetId);
          else if (reference.file) {
            const form = new FormData(); form.append("file", reference.file);
            const upload = await api.post("/storage/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
            const id = upload.data?.data?.image?.id; if (id) referenceImageIds.push(id);
          }
        }
        generationResponse = await generateAIImage({
          prompt: generationPrompt,
          model: selectedModel?.apiModelId || model,
          ratio,
          quality,
          character: scene ? selectedSceneCharacters[0] || null : selectedCharacter,
          sceneId: scene?.id || null,
          projectId,
          characterId: scene ? selectedSceneCharacters[0]?.id || null : selectedCharacter?.id || null,
          characterIds: scene ? selectedSceneCharacters.map((character) => character.id).filter(Boolean) : selectedCharacter?.id ? [selectedCharacter.id] : [],
          sceneScript: scene ? sceneScript : null,
          generationSource: scene ? "storyboard" : "independent",
          referenceImageIds,
        });
      } else {
        let imageUrl = sceneSourceImage || (result?.type === "image" ? result.url : null) || referenceImages[0]?.url;
        const videoReferenceImageIds = [];
        for (const reference of referenceImages) {
          if (reference.assetId) videoReferenceImageIds.push(reference.assetId);
          else if (reference.file) {
            const form = new FormData(); form.append("file", reference.file);
            const upload = await api.post("/storage/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
            const saved = upload.data?.data?.image;
            const uploadedPath = upload.data?.data?.file?.url;
            if (saved?.id) videoReferenceImageIds.push(saved.id);
            if (!imageUrl && uploadedPath) {
              const apiOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
              imageUrl = `${apiOrigin}${uploadedPath}`;
            }
          }
        }
        if (!imageUrl) throw new Error("Add a reference image, or generate an image first, to create a video.");
        const sceneAudioPrompt = scene ? [scene.audioPrompt || "", sceneScript.blocks?.filter((block) => ["dialogue", "narration", "audio"].includes(block.type)).map((block) => `${block.type.toUpperCase()}${block.characterName ? ` (${block.characterName})` : ""}: ${block.text || ""}`).join("\n")].filter(Boolean).join("\n\n") : "";
        const generationId = crypto.randomUUID();
        savePendingVideoGeneration(generationId);
        let response;
        try {
          response = await api.post("/generation/video", {
          imageUrl,
          referenceImageIds: [...new Set(videoReferenceImageIds)],
          frameMode: videoFrameMode,
          prompt: generationPrompt,
          duration: videoDuration,
          quality: scene?.videoQuality || videoQuality,
          sceneId: scene?.id || null,
          projectId: projectId || scene?.projectId || null,
          audio: videoAudioEnabled,
          audioPrompt: sceneAudioPrompt,
          characterIds: scene ? selectedSceneCharacters.map((character) => character.id).filter(Boolean) : selectedCharacter?.id ? [selectedCharacter.id] : [],
          sceneScript: scene ? sceneScript : null,
          generationSource: scene ? "storyboard" : "independent",
          modelId: selectedModel?.id || "auto",
          }, { timeout: 45000, headers: { "Idempotency-Key": generationId } });
        } catch (submissionError) {
          if (submissionError.response) { clearPendingVideoGeneration(generationId); throw submissionError; }
          setVideoProgress({ state: "uncertain", message: "Submission response was interrupted. Checking this request before any retry." });
        }
        generationResponse = await waitForVideoGeneration(api, generationId, setVideoProgress);
      }

      /*
       * Normalize the response so the rest
       * of the workspace has a consistent
       * result object.
       */
      const generatedUrl =
        generationResponse?.url ||
        generationResponse?.imageUrl ||
        generationResponse?.data?.url ||
        generationResponse?.data?.imageUrl ||
        generationResponse?.result?.url ||
        generationResponse?.result?.imageUrl ||
        null;

      if (!generatedUrl) {
        throw new Error(
          "The generation service did not return an image URL.",
        );
      }

      const generatedResult = {
        id:
          generationResponse?.id ||
          generationResponse?.data?.id ||
          Date.now(),

        name:
          scene?.title ||
          scene?.name ||
          `Generated ${type === "video" ? "Video" : "Image"}`,

        type,

        url: generatedUrl,
        downloadUrl: generationResponse?.id ? `${api.defaults.baseURL.replace(/\/$/, "")}/${type === "video" ? "videos" : "images"}/${encodeURIComponent(generationResponse.id)}/download` : generatedUrl,

        prompt: prompt.trim(),

        negativePrompt,

        model,

        ratio,

        quality,

        character: (scene ? selectedSceneCharacters[0] : selectedCharacter)
          ? {
              id: (scene ? selectedSceneCharacters[0] : selectedCharacter).id,
              name: (scene ? selectedSceneCharacters[0] : selectedCharacter).name,
              description:
                (scene ? selectedSceneCharacters[0] : selectedCharacter).description || "",
              image:
                (scene ? selectedSceneCharacters[0] : selectedCharacter).image ||
                (scene ? selectedSceneCharacters[0] : selectedCharacter).imageUrl ||
                null,
            }
          : null,

        sceneId: scene?.id || null,

        sceneTitle:
          scene?.title ||
          scene?.name ||
          null,

        createdAt: new Date(),
      };

      /*
       * Show generated result.
       */
      setResult(generatedResult);

      /*
       * Add to generation history.
       */
      setHistory((current) => [
        generatedResult,
        ...current,
      ]);

      /*
       * Add generated result to
       * the project Asset Library.
       */
      addAsset(generatedResult);

      /*
       * Send result back to ProjectWorkspace.
       */
      onGenerationComplete?.(generatedResult);
    } catch (generationError) {
      if (import.meta.env.DEV) {
        console.error("Generation failed", {
          message: generationError?.message,
          httpStatus: generationError?.status || null,
          providerStatus: generationError?.providerStatus || null,
          requestId: generationError?.requestId || null,
          model: generationError?.model || model,
          phase: generationError?.phase || null,
          code: generationError?.code || null,
          providerCode: generationError?.providerCode || null,
          moderationStage: generationError?.moderationStage || null,
        });
      }

      setErrorCode(generationError?.code || "");
      if (generationError?.response?.status === 402 || generationError?.status === 402) {
        setErrorCode("INSUFFICIENT_CREDITS");
      }
      if (generationError?.code === "CONTENT_SAFETY_REJECTED") {
        setRejectedPrompt(prompt.trim());
      }
      setError(
        generationError?.response?.data?.message || generationError?.message ||
          "Generation failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGeneration = (generation) => {
    if (!generation) {
      return;
    }

    setResult(generation);

    setType(generation.type || "image");

    setPrompt(generation.prompt || "");

    setNegativePrompt(
      generation.negativePrompt || "",
    );

    /*
     * Restore the character used
     * for this generation.
     */
    if (generation.character) {
      selectCharacter(generation.character);
    } else {
      clearCharacter();
    }

    setError("");
  };

  const handleDeleteGeneration = (id) => {
    setHistory((current) =>
      current.filter(
        (generation) => generation.id !== id,
      ),
    );

    setResult((current) =>
      current?.id === id ? null : current,
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles
            size={22}
            className="text-purple-400"
          />

          <h2 className="text-2xl font-semibold text-white">
            Generate
          </h2>
        </div>

        <p className="mt-1 text-sm text-zinc-500">
          Create high-quality AI images and videos
          from your ideas.
        </p>

        {/* Storyboard Scene Indicator */}
        {scene && (
          <div className="inline-flex items-center gap-2 px-3 py-2 mt-4 text-xs border rounded-lg border-purple-500/20 bg-purple-500/5">
            <ClapperboardIcon />

            <span className="text-zinc-400">
              Generating scene:
            </span>

            <span className="font-medium text-purple-400">
              {scene.title ||
                scene.name ||
                "Untitled Scene"}
            </span>
          </div>
        )}
        {scene && <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Source scene</p><p className="mt-1 truncate text-sm font-medium text-white">Scene {String(scene.sceneNumber || 1).padStart(2, "0")} — {scene.title || scene.name || "Storyboard scene"}</p><p className="mt-1 text-xs text-zinc-500">{sceneSourceImage ? "Storyboard image loaded as the generation source." : "No scene image is assigned. This image-to-video provider requires a source image; attach one to continue."}</p>{sceneSourceImage && <img src={sceneSourceImage} alt="Scene source" className="mt-3 max-h-52 w-full rounded-lg border border-zinc-800 bg-black object-contain"/>}</div>
          <span className="whitespace-nowrap rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">Scene loaded</span>
        </div>}
      </div>

      {/* Image / Video Selector */}
      <div data-tour="image-studio" className="flex gap-2 p-1 border w-fit rounded-xl bg-zinc-900 border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setType("image");
            setError("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition ${
            type === "image"
              ? "bg-purple-600 text-white"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          <Image size={17} />
          Image
        </button>

        <button data-tour="video-studio"
          type="button"
          onClick={() => {
            setType("video");
            setError("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition ${
            type === "video"
              ? "bg-purple-600 text-white"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          <Video size={17} />
          Video
        </button>
      </div>

      <PresetLibrary type={type} current={{ prompt, negativePrompt, modelId: selectedModel?.id || "auto", ratio, quality: type === "image" ? quality : videoQuality, duration: videoDuration, audio: videoAudioEnabled, characterId: type === "image" && !scene ? selectedCharacter?.id || null : null, referenceImages: scene ? [] : referenceImages }} onApply={applyPreset} />

      {/* Generation Error */}
      {error && (
        <div className="p-4 text-sm text-red-400 border rounded-xl border-red-500/20 bg-red-500/10">
          {error}
          {errorCode === "INSUFFICIENT_CREDITS" && <a href="/billing" className="ml-2 inline-flex font-medium text-violet-300 underline underline-offset-2">View credits & billing</a>}
          {errorCode === "CONTENT_SAFETY_REJECTED" && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => document.getElementById("generation-prompt")?.focus()} className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/25">Try Again</button>
              {rejectedPrompt === prompt.trim() && <span className="text-xs text-red-300/80">Edit the prompt first. The rejected request will not be repeated unchanged.</span>}
            </div>
          )}
        </div>
      )}

      {/* Main Generator */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Side */}
        <div className="space-y-6">
          {/* Scene-scoped characters or independent generation character */}
          {scene ? <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div><h3 className="text-lg font-semibold text-white">{sceneCharactersSaved ? "Characters from this scene" : "Assign characters to this scene"}</h3><p className="mt-1 text-sm text-zinc-500">{sceneCharactersSaved ? "Only characters saved on this storyboard scene are included." : "This scene has no saved characters. Choose only the characters needed here."}</p></div>
            {sceneCharactersSaved ? <div className="grid gap-3 sm:grid-cols-2">{selectedSceneCharacters.map((character) => <div key={character.id || character.name} className="flex min-w-0 items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3"><img src={character.imageUrl || character.image || character.avatarUrl || ""} alt="" className={`${character.imageUrl || character.image || character.avatarUrl ? "" : "hidden"} h-10 w-10 rounded-lg object-cover`}/><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{character.name || "Character"}</p><p className="truncate text-xs text-zinc-500">{character.id || "Linked by name"}</p></div><span className="ml-auto text-emerald-300">✓</span></div>)}</div> : <>{charactersLoading && !availableSceneCharacters.length ? <p className="text-xs text-zinc-500">Loading available project characters…</p> : <div className="grid gap-2 sm:grid-cols-2">{availableSceneCharacters.map((character) => { const checked = selectedSceneCharacters.some((row) => row.id === character.id); return <label key={character.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${checked ? "border-violet-500/60 bg-violet-500/10" : "border-zinc-800 bg-zinc-950"}`}><input type="checkbox" checked={checked} onChange={() => setSelectedSceneCharacters((current) => checked ? current.filter((row) => row.id !== character.id) : [...current, character])}/><span className="min-w-0"><span className="block truncate text-sm text-white">{character.name}</span><span className="block truncate text-xs text-zinc-500">{character.description || "Reusable character"}</span></span></label>; })}</div>}<button type="button" disabled={savingSceneCharacters || !selectedSceneCharacters.length} onClick={() => saveSceneCharacters()} className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white hover:bg-zinc-700 disabled:opacity-50">{savingSceneCharacters ? "Saving…" : "Save characters to scene"}</button></>}
          </div> : <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900"><CharacterSelector /></div>}

          {scene && sceneScript.blocks?.length > 0 && <details className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><summary className="cursor-pointer text-sm font-medium text-white">Scene script · {sceneScript.blocks.length} blocks</summary><ol className="mt-4 space-y-2">{sceneScript.blocks.map((block, index) => <li key={block.id || index} className="rounded-lg bg-zinc-950 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">{block.type}{block.characterName ? ` · ${block.characterName}` : ""}</p>{block.text && <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-zinc-300">{block.text}</p>}</li>)}</ol><p className="mt-3 text-[11px] text-zinc-600">Blocks are sent in this order with their original character links.</p></details>}

          {/* Prompt */}
          <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <PromptBox
              initialPrompt={prompt}
              onPromptChange={(value) => {
                setPrompt(value);
                if (rejectedPrompt !== null && value.trim() !== rejectedPrompt) setRejectedPrompt(null);
              }}
            />
          </div>

          {/* Reference Images */}
          {!scene && <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <ReferenceImages value={referenceImages} onImagesChange={setReferenceImages} />
          </div>}
          {type === "video" && scene && !sceneSourceImage && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">This scene has no source image. Generate its image first or assign one in the scene editor before creating video.</div>}

          {/* Negative Prompt */}
          {selectedModel?.negativePrompt && <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <NegativePrompt
              value={negativePrompt}
              onNegativePromptChange={
                setNegativePrompt
              }
            />
          </div>}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={
              loading || !prompt.trim() || videoInsufficientCredits || (type === "video" && ["submission_unknown", "expired"].includes(videoProgress?.state)) || (errorCode === "CONTENT_SAFETY_REJECTED" && rejectedPrompt === prompt.trim()) || (scene && type === "video" && !sceneSourceImage)
            }
            className="flex items-center justify-center w-full gap-2 px-6 py-4 font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} />

            {loading
              ? type === "video" ? videoProgress?.state === "running" ? "Generating video…" : videoProgress?.state === "uncertain" ? "Checking video status…" : "Video task queued…" : "Generating..."
              : `Generate ${
                  type === "image"
                    ? "Image"
                    : "Video"
                }${creditCosts ? ` · ${type === "image" ? creditCosts.image : activeVideoCost ?? creditCosts.video} credits` : ""}`}
          </button>
          {loading && type === "video" && <p role="status" className="mt-2 text-center text-xs text-violet-300">{videoProgress?.message || (videoProgress?.state === "running" ? "Alibaba is rendering your video…" : "Video task accepted. Checking status without creating another task…")}</p>}
          {type === "video" && !loading && ["submission_unknown", "expired"].includes(videoProgress?.state) && videoProgress?.generationId && <button type="button" className="mt-2 w-full text-xs text-amber-300 underline" onClick={async () => {
            setLoading(true); setError("");
            try {
              const video = await waitForVideoGeneration(api, videoProgress.generationId, setVideoProgress);
              const recovered = { ...video, type: "video", createdAt: video.createdAt || new Date().toISOString() };
              setResult(recovered); setHistory((current) => [recovered, ...current.filter((item) => item.id !== recovered.id)]); addAsset(recovered); onGenerationComplete?.(recovered);
            } catch (error) { setError(error.response?.data?.message || error.message || "Could not check generation status."); }
            finally { setLoading(false); }
          }}>{videoProgress.state === "expired" ? "Check the saved generation record again — do not submit another request" : "Check this generation status again — do not submit another request"}</button>}
          {type === "video" && activeVideoCost != null && <p className={`text-center text-xs ${videoInsufficientCredits ? "text-amber-300" : "text-zinc-500"}`}>
            {creditBalance == null ? `This ${videoDuration}s ${videoAudioEnabled ? "AI Audio" : "silent"} clip costs ${activeVideoCost} credits.` : `Balance: ${creditBalance} credits · This ${videoDuration}s ${videoAudioEnabled ? "AI Audio" : "silent"} clip costs ${activeVideoCost}.`}
            {videoInsufficientCredits && <> <a href="/billing" className="text-violet-300 underline underline-offset-2">Get more credits</a> or choose a lower-cost silent clip.</>}
          </p>}
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          {/* Generation Settings */}
          <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <ModelSelector type={type} value={selectedModelId} requiredAudio={scene && type === "video" ? scene.audioMode === "silent" ? false : scene.audioMode === "ai_audio" ? true : undefined : undefined} onChange={(id, modelOption) => { setSelectedModelId(id); setSelectedModel(modelOption); if (!scene && type === "video" && modelOption?.audioMode === "automatic") setVideoAudioEnabled(true); if (!scene && type === "video" && modelOption?.audioMode === "none") setVideoAudioEnabled(false); }} />
            {type === "image" ? <GenerationSettings /> : <>
              {selectedModel && !selectedModel.characterConsistency && videoFrameMode === "reference" && <p role="alert" className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">{selectedModel.displayName} supports first-frame image-to-video. Switch to explicit first-frame mode or choose a reference-to-video model.</p>}
              <VideoSettings quality={videoQuality} onQualityChange={setVideoQuality} duration={videoDuration} onDurationChange={(value) => { setVideoDuration(value); setError(""); setErrorCode(""); }} audioEnabled={videoAudioEnabled} audioMode={videoFrameMode === "reference" ? "automatic" : selectedModel?.audioMode} onAudioChange={(value) => { setVideoAudioEnabled(value); setError(""); setErrorCode(""); }} frameMode={videoFrameMode} onFrameModeChange={(value) => { setVideoFrameMode(value); if (value === "reference") setVideoAudioEnabled(true); }} />
            </>}
          </div>

          {/* Generation Preview */}
          <GenerationPreview
            result={result?.url}
            downloadUrl={result?.downloadUrl || result?.url}
            type={result?.type || type}
            loading={loading}
            sourceLabel={scene ? `Storyboard · ${scene.title || scene.name || "Scene"}` : "Independent generation"}
            details={{ model: selectedModel?.displayName || "Auto", ratio, quality, scene: scene?.id || "Independent" }}
          />
        </div>
      </div>

      {type === "image" && <ImageEditTools onComplete={(images) => { if (images[0]) { setResult({ ...images[0], type: "image" }); setHistory((current) => [...images.map((image) => ({ ...image, type: "image" })), ...current]); images.forEach((image) => addAsset({ ...image, type: "image" })); } }} />}

      {/* Generation History */}
      <GenerationHistory
        generations={history}
        onSelect={handleSelectGeneration}
        onDelete={handleDeleteGeneration}
      />
    </div>
  );
}

function ClapperboardIcon() {
  return (
    <span className="flex items-center justify-center w-5 h-5 text-purple-400">
      ✦
    </span>
  );
}
