import { useEffect, useMemo, useState } from "react";
import {
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Clapperboard,
  Image as ImageIcon,
  Video,
  ArrowRight,
} from "lucide-react";

import VideoSceneList from "./VideoSceneList";
import VideoSettings from "./VideoSettings";
import VideoPreview from "./VideoPreview";

import api from "@/services/api";
import { buildVisualScenePrompt, getSceneCharacters, normalizeSceneScript } from "@/utils/sceneScript";

function prettyModelName(model) {
  return String(model || "Alibaba video model")
    .replace(/^wanx?/, "Wan ")
    .replace(/-i2v/, " I2V")
    .replaceAll("-", " ");
}

export default function VideoPanel({
  scenes = [],
  projectId,
  storyScript = "",
  onGenerateVideo,
}) {
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");

  const [quality, setQuality] = useState("720P");
  const [duration, setDuration] = useState("5");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [frameMode, setFrameMode] = useState("reference");
  const [videoCosts, setVideoCosts] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState([]);
  const [sceneProgress, setSceneProgress] = useState(null);
  const [generationError, setGenerationError] = useState("");
  const [sceneStatuses, setSceneStatuses] = useState({});
  const [providerStatus, setProviderStatus] = useState(null);

  useEffect(() => {
    const durations = Array.from(new Set([duration, ...scenes.map((scene) => scene.durationSeconds || duration)].map((value) => Math.min(15, Math.max(2, Number(value) || 5)))));
    Promise.all(durations.map(async (seconds) => {
      const { data } = await api.get(`/credits/costs?duration=${seconds}`);
      return [seconds, data?.data?.costs || null];
    })).then((rows) => setVideoCosts(Object.fromEntries(rows))).catch(() => {});
  }, [duration, scenes]);

  /*
   * --------------------------------
   * Load Previously Generated Video
   * --------------------------------
   */
  useEffect(() => {
    if (!projectId) {
      return;
    }

    let cancelled = false;

    const loadSavedVideo = async () => {
      setVideoLoading(true);
      setVideoError("");

      try {
        const response = await api.get(`/videos/project/${projectId}`);

        const data = response.data?.data;

        const videos = data?.videos || data || [];

        if (cancelled || !Array.isArray(videos)) {
          return;
        }

        if (videos.length === 0) {
          setGeneratedVideos([]);
          return;
        }

        setGeneratedVideos(videos.filter(Boolean).map((video) => ({
          ...video, id: video.id, type: "video",
          url: video.url || video.videoUrl || video.outputUrl || video.generatedUrl || null,
          model: video.model || video.metadata?.selectedModel || video.metadata?.model,
          fallbackUsed: video.fallbackUsed ?? video.metadata?.fallbackUsed ?? false,
          audioRequested: video.audioRequested ?? video.metadata?.audioRequested ?? video.metadata?.audio,
          audioGenerated: video.audioGenerated ?? video.metadata?.audioGenerated ?? video.metadata?.audio,
        })));
      } catch (error) {
        console.error("Failed to load saved video:", error);

        if (!cancelled) {
          setVideoError(
            error.response?.data?.message ||
              error.message ||
              "Failed to load the saved video.",
          );
        }
      } finally {
        if (!cancelled) {
          setVideoLoading(false);
        }
      }
    };

    loadSavedVideo();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /*
   * --------------------------------
   * Scene Readiness
   * --------------------------------
   */
  const generatedScenes = useMemo(
    () =>
      scenes.filter((scene) => getSceneImageUrl(scene)),
    [scenes],
  );

  const pendingScenes = useMemo(
    () =>
      scenes.filter((scene) => !getSceneImageUrl(scene)),
    [scenes],
  );

  const usedCharacters = useMemo(() => {
    const characterMap = new Map();

    scenes.forEach((scene) => {
      getSceneCharacters(scene).forEach((character) => {
        const key = character.id || character.name;
        if (key) characterMap.set(key, character);
      });
    });

    return Array.from(characterMap.values());
  }, [scenes]);

  const sceneCount = scenes.length;
  const readyCount = generatedScenes.length;
  const pendingCount = pendingScenes.length;

  /*
   * --------------------------------
   * Generation Eligibility
   * --------------------------------
   */
  const canGenerate =
    sceneCount > 0 && readyCount > 0 && Boolean(projectId) && !isGenerating;

  /*
   * --------------------------------
   * Generate Video
   * --------------------------------
   *
   * Generate one provider clip for each scene that has a source image.
   */
  const handleGenerateVideo = async () => {
    if (!canGenerate) {
      return;
    }
    const scenesToRender = generatedScenes;
    setIsGenerating(true);
    setGenerationError("");
    setProviderStatus(null);
    setSceneProgress({ current: 0, total: scenesToRender.length, title: "Preparing scenes" });
    setSceneStatuses(Object.fromEntries(scenesToRender.map((scene) => [scene.id, "Waiting"])));
    const failed = [];

    for (const [index, sourceScene] of scenesToRender.entries()) {
      const imageUrl = getSceneImageUrl(sourceScene);
      const sceneDuration = Math.min(15, Math.max(2, Number(sourceScene.durationSeconds) || Number(duration) || 5));
      const sceneCharacters = getSceneCharacters(sourceScene);
      const sceneAudio = sourceScene.audioMode === "audio" ? true : sourceScene.audioMode === "silent" ? false : audioEnabled;
      const scriptBlocks = normalizeSceneScript(sourceScene.sceneScript || sourceScene.metadata?.sceneScript).blocks;
      const scriptAudio = scriptBlocks.filter((block) => ["dialogue", "narration", "audio"].includes(block.type) && block.text.trim()).map((block) => {
        const label = block.type.toUpperCase();
        const character = block.characterName ? ` (${block.characterName})` : "";
        return `${label}${character}: ${block.text.trim()}`;
      }).join("\n");
      const audioPrompt = [sourceScene.audioPrompt, scriptAudio].filter(Boolean).join("\n\n");
      const storyCharacterNames = scenes.flatMap((scene) => getSceneCharacters(scene).map((character) => character.name));
      const storyBlockNames = scenes.flatMap((scene) => normalizeSceneScript(scene.sceneScript || scene.metadata?.sceneScript).blocks.map((block) => block.characterName));
      const videoPrompt = buildVisualScenePrompt({
        title: `Scene ${index + 1}: ${sourceScene.title || sourceScene.name || "Storyboard scene"}`,
        story: storyScript,
        direction: sourceScene.prompt || sourceScene.description || sourceScene.title || "Create natural cinematic motion from the source image.",
        notes: sourceScene.notes || "",
        sceneScript: sourceScene.sceneScript || sourceScene.metadata?.sceneScript,
        characters: sceneCharacters,
        characterNames: [...storyCharacterNames, ...storyBlockNames],
        referencePolicy: "Use the supplied storyboard frame as the visual source. Preserve the scene composition, environment and visible character identities, and animate the characters naturally. Character names are internal identifiers only.",
      });
      setSceneProgress({ current: index + 1, total: scenesToRender.length, title: sourceScene.title || sourceScene.name || "Scene " + (index + 1) });
      setSceneStatuses((current) => ({ ...current, [sourceScene.id]: "Generating" }));
      const generationId = crypto.randomUUID();
      let pollingStatus = true;
      let statusTimer = null;
      const pollProviderStatus = async () => {
        try {
          const response = await api.get(`/generation/video/status/${encodeURIComponent(generationId)}`);
          if (pollingStatus && response.data?.data) setProviderStatus(response.data.data);
        } catch {
          // The generation request may not have reached its provider preflight yet.
        } finally {
          if (pollingStatus) statusTimer = window.setTimeout(pollProviderStatus, 900);
        }
      };
      void pollProviderStatus();
      try {
        const response = await api.post("/generation/video", {
          projectId,
          sceneId: sourceScene.id || null,
          imageId: sourceScene.imageId || (sourceScene.generatedType === "image" ? sourceScene.generatedId : null),
          imageUrl,
          frameMode,
          prompt: videoPrompt,
          duration: sceneDuration,
          quality,
          audio: sceneAudio,
          audioPrompt,
          characterIds: sceneCharacters.map((character) => character.id).filter(Boolean),
          sceneScript: sourceScene.sceneScript || sourceScene.metadata?.sceneScript || { version: 1, blocks: [] },
          generationSource: "storyboard",
        }, { timeout: 360000, headers: { "Idempotency-Key": generationId } });
        const data = response.data?.data || response.data || null;
        if (!data?.url) throw new Error("The provider returned no video for this scene.");
        const result = { ...data, id: data.id || null, type: "video", url: data.url, projectId, sceneId: data.sceneId || sourceScene.id || null, quality, duration: Number(data.duration) || sceneDuration, createdAt: data.createdAt || new Date().toISOString(), sceneTitle: sourceScene.title || sourceScene.name || "Scene " + (index + 1) };
        setGeneratedVideos((current) => [result, ...current.filter((item) => item.sceneId !== result.sceneId)]);
        onGenerateVideo?.(result);
        setSceneStatuses((current) => ({ ...current, [sourceScene.id]: "Completed" }));
      } catch (error) {
        const providerError = error.response?.data;
        const message = [
          providerError?.message || error.message || "Video generation failed.",
          providerError?.providerStatus ? `Provider HTTP ${providerError.providerStatus}` : null,
          providerError?.providerCode ? `code ${providerError.providerCode}` : null,
          providerError?.requestId ? `request ${providerError.requestId}` : null,
        ].filter(Boolean).join(" — ");
        console.error("Storyboard scene video generation failed:", {
          sceneId: sourceScene.id,
          message,
          httpStatus: error.response?.status || null,
          provider: providerError?.provider || null,
          providerStatus: providerError?.providerStatus || null,
          providerCode: providerError?.providerCode || null,
          requestId: providerError?.requestId || null,
        });
        failed.push(`${sourceScene.title || sourceScene.name || "Scene " + (index + 1)}: ${message}`);
        setSceneStatuses((current) => ({ ...current, [sourceScene.id]: "Failed" }));
      } finally {
        pollingStatus = false;
        if (statusTimer) window.clearTimeout(statusTimer);
        setProviderStatus(null);
      }
    }
    setIsGenerating(false);
    setSceneProgress(null);
    setGenerationError(failed.length ? "Could not generate " + failed.length + " scene clip(s): " + failed.join("; ") + ". Other scene clips are saved." : "");
  };

  /*
   * --------------------------------
   * Loading State
   * --------------------------------
   */
  if (videoLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span className="w-4 h-4 border-2 rounded-full border-zinc-700 border-t-purple-400 animate-spin" />
          Loading video workspace...
        </div>
      </div>
    );
  }

  /*
   * --------------------------------
   * Empty State
   * --------------------------------
   */
  if (sceneCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center border rounded-2xl border-zinc-800 bg-zinc-900/50">
        <Clapperboard size={42} strokeWidth={1.3} className="text-purple-400" />

        <h2 className="mt-5 text-lg font-semibold text-white">
          Build your storyboard first
        </h2>

        <p className="max-w-md mt-2 text-sm leading-6 text-zinc-500">
          Create storyboard scenes and generate their images before turning them
          into cinematic video clips.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* --------------------------------
          Header
      --------------------------------- */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
            <Film size={20} className="text-purple-400" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Video Generation
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Turn your storyboard imagery into cinematic video.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------
          Readiness
      --------------------------------- */}
      <div className="grid gap-4 md:grid-cols-3">
        <ReadinessCard
          icon={Clapperboard}
          label="Storyboard"
          value={`${sceneCount} ${sceneCount === 1 ? "Scene" : "Scenes"}`}
          ready={sceneCount > 0}
        />

        <ReadinessCard
          icon={ImageIcon}
          label="Generated Scenes"
          value={`${readyCount}/${sceneCount}`}
          ready={readyCount > 0}
        />

        <ReadinessCard
          icon={Users}
          label="Characters"
          value={usedCharacters.length}
          ready={usedCharacters.length > 0}
        />
      </div>

      {/* --------------------------------
          Main Workspace
      --------------------------------- */}
      <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
        {/* Storyboard Sequence */}
        <div className="border xl:col-span-8 rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="flex flex-col gap-3 px-5 py-4 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">Storyboard Sequence</h3>

              <p className="mt-1 text-xs text-zinc-500">
                These scenes provide the visual foundation for your video.
              </p>
            </div>

            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                pendingCount === 0
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-amber-400 bg-amber-500/10"
              }`}
            >
              {pendingCount === 0 ? "Ready" : `${pendingCount} pending`}
            </span>
          </div>

          <div className="p-4">
            <VideoSceneList scenes={scenes} />
          </div>
        </div>

        {/* Video Settings */}
        <div className="xl:col-span-4 xl:row-span-2">
          <VideoSettings
            quality={quality}
            duration={duration}
            onQualityChange={setQuality}
            onDurationChange={setDuration}
            audioEnabled={audioEnabled}
            onAudioChange={setAudioEnabled}
            frameMode={frameMode}
            audioMode={frameMode === "reference" ? "automatic" : undefined}
            onFrameModeChange={(value) => { setFrameMode(value); if (value === "reference") setAudioEnabled(true); }}
          />
        </div>

        {/* Characters */}
        <div className="border xl:col-span-4 rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h3 className="font-semibold text-white">Characters in Video</h3>

            <p className="mt-1 text-xs text-zinc-500">
              Characters referenced by your storyboard scenes.
            </p>
          </div>

          <div className="p-5">
            {usedCharacters.length === 0 ? (
              <div className="flex items-center gap-3 p-4 border border-dashed rounded-xl border-zinc-800 bg-zinc-950">
                <Users size={18} className="text-zinc-600" />

                <p className="text-xs text-zinc-600">
                  No reusable characters assigned to these scenes.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {usedCharacters.map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center gap-3 p-3 border rounded-xl border-zinc-800 bg-zinc-950"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden rounded-lg bg-zinc-900">
                      {character.imageUrl || character.image ? (
                        <img
                          src={character.imageUrl || character.image}
                          alt={character.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Users size={16} className="text-zinc-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {character.name}
                      </p>

                      <p className="text-[11px] text-zinc-600">
                        Reusable character
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Video Generation */}
        <div className="p-5 border xl:col-span-4 rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 rounded-lg w-9 h-9 bg-purple-500/10">
              <Sparkles size={17} className="text-purple-400" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">
                AI Video Generation
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Every scene uses its selected or generated image as its own starting frame.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <Video size={15} className="text-zinc-500" />

              <span className="text-xs font-medium text-zinc-400">
                Scenes with images
              </span>
            </div>

            {generatedScenes.length > 0 ? (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {generatedScenes.map((scene, index) => <div key={scene.id || index} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-2">
                  <img src={getSceneImageUrl(scene)} alt={scene.title || "Scene reference"} className="h-14 w-20 rounded-lg bg-black object-cover" loading="lazy"/>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white">{scene.title || scene.name || "Scene " + (index + 1)}</p><p className="mt-1 text-[11px] text-zinc-500">{scene.durationSeconds || duration}s clip · {scene.character?.name || "No character assigned"} · {scene.audioMode === "silent" || (scene.audioMode === "inherit" && !audioEnabled) ? "No Audio" : "AI Audio"}</p><p className="mt-1 text-[10px] text-violet-300">{sceneStatuses[scene.id] || "Waiting"}</p></div>
                </div>)}
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-xl border-zinc-800">
                <p className="text-xs text-zinc-600">
                  Add a library image to a scene or generate its scene image first.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-start gap-3 p-3 border rounded-xl border-zinc-800 bg-zinc-950">
              <ArrowRight
                size={15}
                className="flex-shrink-0 mt-0.5 text-purple-400"
              />

              <p className="text-[11px] leading-5 text-zinc-600">
                Image → motion → cinematic video clip
              </p>
            </div>
          </div>
        </div>

        {/* Generate Video */}
        <div className="p-5 border xl:col-span-4 rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 rounded-lg w-9 h-9 bg-purple-500/10">
              <Film size={17} className="text-purple-400" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">
                Generate Video
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Create a separate video clip for each scene image. Each scene uses its own duration and direction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 mt-5 border rounded-xl border-zinc-800 bg-zinc-950">
            <CheckCircle2
              size={15}
              className={canGenerate ? "text-emerald-400" : "text-zinc-600"}
            />

            <p className="text-[11px] text-zinc-500">
              {canGenerate
                ? readyCount + " scene clip" + (readyCount === 1 ? " is" : "s are") + " ready."
                : "Attach or generate an image for a storyboard scene first."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={!canGenerate}
            className="flex items-center justify-center w-full gap-2 px-5 py-3.5 mt-4 text-sm font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={17} />

            {isGenerating ? "Generating scene " + sceneProgress?.current + " of " + sceneProgress?.total + "…" : "Generate " + readyCount + " scene video" + (readyCount === 1 ? "" : "s")}
          </button>

          {sceneProgress && <p role="status" className="mt-2 text-xs text-violet-300">{providerStatus?.state === "switching"
            ? `Primary model unavailable. Switching to ${prettyModelName(providerStatus.nextModel)}…`
            : providerStatus?.state === "backup"
              ? `Using backup model ${prettyModelName(providerStatus.model)}…`
              : providerStatus?.model
                ? `Generating with ${prettyModelName(providerStatus.model)}…`
                : "Preparing Alibaba video generation…"} · Scene {sceneProgress.current} of {sceneProgress.total}: {sceneProgress.title}</p>}
          {videoCosts && <p className="mt-2 text-xs text-zinc-500">Estimated queue cost: {generatedScenes.reduce((total, scene) => { const sceneDuration = Math.min(15, Math.max(2, Number(scene.durationSeconds) || Number(duration) || 5)); const costs = videoCosts[sceneDuration] || {}; return total + ((scene.audioMode === "silent" || (scene.audioMode === "inherit" && !audioEnabled)) ? costs.videoSilent || 0 : costs.videoAudio || 0); }, 0)} credits</p>}

          {!projectId && (
            <p className="mt-3 text-[11px] text-red-400">
              Project information is missing.
            </p>
          )}

          {pendingCount > 0 && (
            <p className="mt-3 text-[11px] leading-5 text-amber-400">
              {pendingCount} scene{pendingCount === 1 ? "" : "s"} need an image. Add an image or generate one from the scene editor.
            </p>
          )}

          {generationError && (
            <div className="flex items-start gap-2 mt-3">
              <AlertCircle
                size={14}
                className="flex-shrink-0 mt-0.5 text-red-400"
              />

              <p className="text-[11px] leading-5 text-red-400">
                {generationError}
              </p>
            </div>
          )}
        </div>

        {/* Video Summary */}
        <div className="p-5 border xl:col-span-12 rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Video Summary
              </h3>

              <div className="grid grid-cols-2 mt-4 gap-x-6 gap-y-4 sm:grid-cols-3">
                <SummaryRow label="Scenes" value={sceneCount} />

                <SummaryRow
                  label="Generated"
                  value={`${readyCount}/${sceneCount}`}
                />

                <SummaryRow label="Characters" value={usedCharacters.length} />

                <SummaryRow
                  label="Resolution"
                  value={quality}
                />

                <SummaryRow
                  label="Duration"
                  value={generatedScenes.reduce((total, scene) => total + (Number(scene.durationSeconds) || Number(duration) || 5), 0) + " seconds total"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Generated Video */}
        {generatedVideos.length > 0 && (
          <div className="border xl:col-span-12 rounded-2xl border-zinc-800 bg-zinc-900">
            <div className="flex flex-col gap-3 px-5 py-4 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-400" />

                  <h3 className="font-semibold text-white">Scene video clips</h3>
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                  {generatedVideos.length} saved scene clip{generatedVideos.length === 1 ? "" : "s"}. Each clip remains linked to its storyboard scene.
                </p>
              </div>

              <span className="px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-400 bg-emerald-500/10">
                Complete
              </span>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              {generatedVideos.map((video) => <article key={video.id || video.sceneId} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="mb-2 flex justify-between gap-3"><h4 className="truncate text-sm font-medium text-white">{video.sceneTitle || video.name || "Storyboard scene"}</h4><span className="shrink-0 text-xs text-zinc-500">{video.duration}s</span></div>
                {video.url ? <VideoPreview video={video} /> : <p className="text-xs text-zinc-500">Preview unavailable.</p>}
              </article>)}
            </div>
          </div>
        )}

        {videoError && (
          <div className="flex items-start gap-3 p-4 border xl:col-span-12 rounded-xl border-amber-500/20 bg-amber-500/5">
            <AlertCircle
              size={16}
              className="flex-shrink-0 mt-0.5 text-amber-400"
            />

            <p className="text-xs leading-5 text-amber-400">{videoError}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * --------------------------------
 * Readiness Card
 * --------------------------------
 */
function ReadinessCard({ icon: Icon, label, value, ready }) {
  return (
    <div className="flex items-center gap-3 p-4 border rounded-2xl border-zinc-800 bg-zinc-900">
      <div
        className={`flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-lg ${
          ready ? "bg-emerald-500/10" : "bg-zinc-800"
        }`}
      >
        <Icon
          size={17}
          className={ready ? "text-emerald-400" : "text-zinc-500"}
        />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-zinc-600">{label}</p>

        <p className="mt-0.5 text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

/*
 * --------------------------------
 * Summary Row
 * --------------------------------
 */
function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-zinc-600">{label}</span>

      <span className="text-xs font-medium text-zinc-300">{value}</span>
    </div>
  );
}

function getSceneImageUrl(scene) {
  if (scene?.imageUrl || scene?.image) return scene.imageUrl || scene.image;
  if (scene?.generatedType === "image") return scene.generatedUrl || scene.generatedImageUrl || null;
  return null;
}
