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

export default function VideoPanel({
  scenes = [],
  projectId,
  onGenerateVideo,
}) {
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");

  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [quality, setQuality] = useState("high");
  const [duration, setDuration] = useState("3.5");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [generationError, setGenerationError] = useState("");

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
        const response = await api.get(
          `/videos/project/${projectId}`,
        );

        const data = response.data?.data;

        const videos =
          data?.videos ||
          data ||
          [];

        if (
          cancelled ||
          !Array.isArray(videos)
        ) {
          return;
        }

        if (videos.length === 0) {
          setGeneratedVideo(null);
          return;
        }

        const latestVideo = [...videos]
          .filter(Boolean)
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0) -
              new Date(a.createdAt || 0),
          )[0];

        if (!latestVideo) {
          return;
        }

        const normalizedVideo = {
          ...latestVideo,
          id: latestVideo.id,
          type: "video",
          url:
            latestVideo.url ||
            latestVideo.videoUrl ||
            latestVideo.outputUrl ||
            latestVideo.generatedUrl ||
            null,
        };

        setGeneratedVideo(normalizedVideo);
      } catch (error) {
        console.error(
          "Failed to load saved video:",
          error,
        );

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
      scenes.filter(
        (scene) =>
          scene?.generatedUrl ||
          scene?.image ||
          scene?.imageUrl ||
          scene?.video,
      ),
    [scenes],
  );

  const pendingScenes = useMemo(
    () =>
      scenes.filter(
        (scene) =>
          !scene?.generatedUrl &&
          !scene?.image &&
          !scene?.imageUrl &&
          !scene?.video,
      ),
    [scenes],
  );

  const usedCharacters = useMemo(() => {
    const characterMap = new Map();

    scenes.forEach((scene) => {
      if (scene?.character?.id) {
        characterMap.set(
          scene.character.id,
          scene.character,
        );
      }
    });

    return Array.from(
      characterMap.values(),
    );
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
    sceneCount > 0 &&
    readyCount > 0 &&
    Boolean(projectId) &&
    !isGenerating;

  /*
   * --------------------------------
   * Generate Video
   * --------------------------------
   *
   * The current Wan 2.2 integration generates
   * one video clip from one storyboard image.
   *
   * We use the first generated storyboard scene
   * for this MVP video-generation step.
   */
  const handleGenerateVideo = async () => {
    if (!canGenerate) {
      return;
    }

    const sourceScene =
      generatedScenes[0];

    if (!sourceScene) {
      setGenerationError(
        "A generated storyboard image is required before creating a video.",
      );
      return;
    }

    const imageUrl =
      sourceScene.generatedUrl ||
      sourceScene.imageUrl ||
      sourceScene.image ||
      null;

    if (!imageUrl) {
      setGenerationError(
        "The selected storyboard scene does not contain a usable image.",
      );
      return;
    }

    const videoPrompt =
      sourceScene.prompt ||
      sourceScene.description ||
      sourceScene.title ||
      sourceScene.name ||
      "Create a cinematic video from this storyboard scene.";

    setIsGenerating(true);
    setGeneratedVideo(null);
    setGenerationError("");

    try {
      const response = await api.post(
        "/generation/video",
        {
          projectId,
          sceneId:
            sourceScene.id || null,
          imageUrl,
          prompt: videoPrompt,
          duration:
            duration === "auto"
              ? 3.5
              : Number(duration) || 3.5,
          aspectRatio,
          quality,
        },
      );

      const data =
        response.data?.data ||
        response.data ||
        null;

      if (!data?.url) {
        throw new Error(
          "Video generation completed but no video URL was returned.",
        );
      }

      const result = {
        ...data,
        id: data.id || null,
        type: "video",
        url: data.url,
        projectId,
        sceneId:
          data.sceneId ||
          sourceScene.id ||
          null,
        aspectRatio,
        quality,
        duration:
          Number(data.duration) ||
          Number(duration) ||
          3.5,
        sceneCount,
        createdAt:
          data.createdAt ||
          new Date().toISOString(),
      };

      setGeneratedVideo(result);

      onGenerateVideo?.(result);
    } catch (error) {
      console.error(
        "Video generation failed:",
        error,
      );

      setGenerationError(
        error.response?.data?.message ||
          error.message ||
          "Video generation failed. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
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
        <Clapperboard
          size={42}
          strokeWidth={1.3}
          className="text-purple-400"
        />

        <h2 className="mt-5 text-lg font-semibold text-white">
          Build your storyboard first
        </h2>

        <p className="max-w-md mt-2 text-sm leading-6 text-zinc-500">
          Create storyboard scenes and generate
          their images before turning them into
          cinematic video clips.
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
            <Film
              size={20}
              className="text-purple-400"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Video Generation
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Turn your storyboard imagery into
              cinematic video.
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
          value={`${sceneCount} ${
            sceneCount === 1
              ? "Scene"
              : "Scenes"
          }`}
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
          ready={
            usedCharacters.length > 0
          }
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
              <h3 className="font-semibold text-white">
                Storyboard Sequence
              </h3>

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
              {pendingCount === 0
                ? "Ready"
                : `${pendingCount} pending`}
            </span>
          </div>

          <div className="p-4">
            <VideoSceneList scenes={scenes} />
          </div>
        </div>

        {/* Video Settings */}
        <div className="xl:col-span-4 xl:row-span-2">
          <VideoSettings
            aspectRatio={aspectRatio}
            quality={quality}
            duration={duration}
            onAspectRatioChange={setAspectRatio}
            onQualityChange={setQuality}
            onDurationChange={setDuration}
          />
        </div>

        {/* Characters */}
        <div className="border xl:col-span-4 rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h3 className="font-semibold text-white">
              Characters in Video
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              Characters referenced by your storyboard scenes.
            </p>
          </div>

          <div className="p-5">
            {usedCharacters.length === 0 ? (
              <div className="flex items-center gap-3 p-4 border border-dashed rounded-xl border-zinc-800 bg-zinc-950">
                <Users
                  size={18}
                  className="text-zinc-600"
                />

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
                          src={
                            character.imageUrl ||
                            character.image
                          }
                          alt={character.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Users
                          size={16}
                          className="text-zinc-600"
                        />
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
              <Sparkles
                size={17}
                className="text-purple-400"
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">
                AI Video Generation
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Nebula will use the first generated storyboard image as
                the starting frame for the AI video clip.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <Video
                size={15}
                className="text-zinc-500"
              />

              <span className="text-xs font-medium text-zinc-400">
                Source Scene
              </span>
            </div>

            {generatedScenes[0] ? (
              <div className="overflow-hidden border rounded-xl border-zinc-800 bg-zinc-950">
                <div className="aspect-video bg-zinc-900">
                  {(
                    generatedScenes[0].generatedUrl ||
                    generatedScenes[0].imageUrl ||
                    generatedScenes[0].image
                  ) && (
                    <img
                      src={
                        generatedScenes[0].generatedUrl ||
                        generatedScenes[0].imageUrl ||
                        generatedScenes[0].image
                      }
                      alt={
                        generatedScenes[0].title ||
                        generatedScenes[0].name ||
                        "Storyboard scene"
                      }
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>

                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">
                    {generatedScenes[0].title ||
                      generatedScenes[0].name ||
                      "Storyboard Scene 1"}
                  </p>

                  <p className="mt-1 text-[11px] text-zinc-600">
                    Starting frame
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-xl border-zinc-800">
                <p className="text-xs text-zinc-600">
                  Generate at least one storyboard image first.
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
              <Film
                size={17}
                className="text-purple-400"
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">
                Generate Video
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Create a cinematic video clip from your first generated
                storyboard image.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 mt-5 border rounded-xl border-zinc-800 bg-zinc-950">
            <CheckCircle2
              size={15}
              className={
                canGenerate
                  ? "text-emerald-400"
                  : "text-zinc-600"
              }
            />

            <p className="text-[11px] text-zinc-500">
              {canGenerate
                ? "Ready to generate a video clip."
                : "Generate a storyboard image before continuing."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={!canGenerate}
            className="flex items-center justify-center w-full gap-2 px-5 py-3.5 mt-4 text-sm font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={17} />

            {isGenerating
              ? "Generating Video..."
              : "Generate Video Clip"}
          </button>

          {!projectId && (
            <p className="mt-3 text-[11px] text-red-400">
              Project information is missing.
            </p>
          )}

          {pendingCount > 0 && (
            <p className="mt-3 text-[11px] leading-5 text-amber-400">
              {pendingCount} storyboard scene
              {pendingCount === 1 ? "" : "s"} still need generated
              imagery. The first completed scene can still be used
              for this video clip.
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
                <SummaryRow
                  label="Scenes"
                  value={sceneCount}
                />

                <SummaryRow
                  label="Generated"
                  value={`${readyCount}/${sceneCount}`}
                />

                <SummaryRow
                  label="Characters"
                  value={usedCharacters.length}
                />

                <SummaryRow
                  label="Aspect Ratio"
                  value={aspectRatio}
                />

                <SummaryRow
                  label="Quality"
                  value={
                    quality === "high"
                      ? "High"
                      : quality
                  }
                />

                <SummaryRow
                  label="Duration"
                  value={
                    duration === "auto"
                      ? "3.5 seconds"
                      : `${duration} seconds`
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Generated Video */}
        {generatedVideo && (
          <div className="border xl:col-span-12 rounded-2xl border-zinc-800 bg-zinc-900">
            <div className="flex flex-col gap-3 px-5 py-4 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-emerald-400"
                  />

                  <h3 className="font-semibold text-white">
                    Video Generated
                  </h3>
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                  Your AI-generated video clip is ready.
                </p>
              </div>

              <span className="px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-400 bg-emerald-500/10">
                Complete
              </span>
            </div>

            <div className="p-5">
              {generatedVideo.url ? (
                <VideoPreview video={generatedVideo} />
              ) : (
                <div className="p-5 text-sm text-zinc-500">
                  Video generated, but the preview URL is unavailable.
                </div>
              )}
            </div>
          </div>
        )}

        {videoError && (
          <div className="flex items-start gap-3 p-4 border xl:col-span-12 rounded-xl border-amber-500/20 bg-amber-500/5">
            <AlertCircle
              size={16}
              className="flex-shrink-0 mt-0.5 text-amber-400"
            />

            <p className="text-xs leading-5 text-amber-400">
              {videoError}
            </p>
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
function ReadinessCard({
  icon: Icon,
  label,
  value,
  ready,
}) {
  return (
    <div className="flex items-center gap-3 p-4 border rounded-2xl border-zinc-800 bg-zinc-900">
      <div
        className={`flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-lg ${
          ready
            ? "bg-emerald-500/10"
            : "bg-zinc-800"
        }`}
      >
        <Icon
          size={17}
          className={
            ready
              ? "text-emerald-400"
              : "text-zinc-500"
          }
        />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-zinc-600">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-medium text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

/*
 * --------------------------------
 * Summary Row
 * --------------------------------
 */
function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-zinc-600">
        {label}
      </span>

      <span className="text-xs font-medium text-zinc-300">
        {value}
      </span>
    </div>
  );
}