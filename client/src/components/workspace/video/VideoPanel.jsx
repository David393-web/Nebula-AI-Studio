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

/*
 * --------------------------------
 * Normalize Video
 * --------------------------------
 *
 * Keeps backend video responses in one
 * predictable shape for the UI.
 */
function normalizeVideo(video, fallbackProjectId = null) {
  if (!video) {
    return null;
  }

  return {
    ...video,

    id: video.id || null,

    type: video.type || "video",

    url:
      video.url ||
      video.videoUrl ||
      video.outputUrl ||
      video.generatedUrl ||
      null,

    aspectRatio:
      video.aspectRatio ||
      video.aspect_ratio ||
      null,

    quality:
      video.quality ||
      null,

    duration:
      video.duration ??
      null,

    sceneCount:
      video.sceneCount ??
      video.scene_count ??
      null,

    projectId:
      video.projectId ||
      video.project_id ||
      fallbackProjectId ||
      null,

    createdAt:
      video.createdAt ||
      video.created_at ||
      null,

    updatedAt:
      video.updatedAt ||
      video.updated_at ||
      null,
  };
}

/*
 * --------------------------------
 * Extract Videos
 * --------------------------------
 *
 * Handles the response shapes that the
 * backend may return.
 */
function extractVideos(response) {
  const data = response?.data?.data;

  if (Array.isArray(data?.videos)) {
    return data.videos;
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(response?.data?.videos)) {
    return response.data.videos;
  }

  return [];
}

/*
 * --------------------------------
 * Get Latest Video
 * --------------------------------
 */
function getLatestVideo(videos) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return null;
  }

  return [...videos]
    .filter(Boolean)
    .sort((a, b) => {
      const dateA = new Date(
        a?.createdAt ||
          a?.created_at ||
          0,
      ).getTime();

      const dateB = new Date(
        b?.createdAt ||
          b?.created_at ||
          0,
      ).getTime();

      return dateB - dateA;
    })[0] || null;
}

export default function VideoPanel({
  scenes = [],
  projectId,
  onGenerateVideo,
}) {
  const [aspectRatio, setAspectRatio] =
    useState("16:9");

  const [quality, setQuality] =
    useState("high");

  const [duration, setDuration] =
    useState("auto");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [generatedVideo, setGeneratedVideo] =
    useState(null);

  const [videoLoading, setVideoLoading] =
    useState(false);

  const [videoError, setVideoError] =
    useState("");

  const [generationError, setGenerationError] =
    useState("");

  /*
   * --------------------------------
   * Load Saved Video
   * --------------------------------
   */
  useEffect(() => {
    if (!projectId) {
      return undefined;
    }

    let cancelled = false;

    const loadSavedVideo = async () => {
      setVideoLoading(true);
      setVideoError("");

      try {
        const response = await api.get(
          `/videos/project/${projectId}`,
        );

        if (cancelled) {
          return;
        }

        const videos = extractVideos(response);

        const latestVideo =
          getLatestVideo(videos);

        if (!latestVideo) {
          setGeneratedVideo(null);
          return;
        }

        const normalizedVideo =
          normalizeVideo(
            latestVideo,
            projectId,
          );

        if (!normalizedVideo) {
          return;
        }

        setGeneratedVideo(
          normalizedVideo,
        );

        /*
         * Restore the settings from the
         * saved video when available.
         */
        if (
          normalizedVideo.aspectRatio
        ) {
          setAspectRatio(
            normalizedVideo.aspectRatio,
          );
        }

        if (normalizedVideo.quality) {
          setQuality(
            normalizedVideo.quality,
          );
        }

        if (
          normalizedVideo.duration !==
            null &&
          normalizedVideo.duration !==
            undefined
        ) {
          setDuration(
            normalizedVideo.duration,
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load saved video:",
          error,
        );

        setVideoError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load the saved video.",
        );
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
   * Generated Scenes
   * --------------------------------
   */
  const generatedScenes = useMemo(
    () =>
      scenes.filter(
        (scene) =>
          Boolean(
            scene?.generatedUrl ||
              scene?.image ||
              scene?.video,
          ),
      ),
    [scenes],
  );

  /*
   * --------------------------------
   * Pending Scenes
   * --------------------------------
   */
  const pendingScenes = useMemo(
    () =>
      scenes.filter(
        (scene) =>
          !scene?.generatedUrl &&
          !scene?.image &&
          !scene?.video,
      ),
    [scenes],
  );

  /*
   * --------------------------------
   * Characters Used
   * --------------------------------
   */
  const usedCharacters = useMemo(() => {
    const characterMap = new Map();

    scenes.forEach((scene) => {
      const character = scene?.character;

      if (character?.id) {
        characterMap.set(
          character.id,
          character,
        );
      }
    });

    return Array.from(
      characterMap.values(),
    );
  }, [scenes]);

  const sceneCount = scenes.length;
  const readyCount =
    generatedScenes.length;
  const pendingCount =
    pendingScenes.length;

  const canGenerate =
    sceneCount > 0 &&
    pendingCount === 0 &&
    !isGenerating &&
    Boolean(projectId);

  /*
   * --------------------------------
   * Generate Final Video
   * --------------------------------
   */
  const handleGenerateVideo = async () => {
    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setGenerationError("");

    try {
      const payload = {
        projectId,

        aspectRatio,

        quality,

        duration,

        sceneCount,

        scenes: scenes.map(
          (scene, index) => ({
            id: scene?.id || null,

            order: index + 1,

            title:
              scene?.title ||
              scene?.name ||
              `Scene ${index + 1}`,

            prompt:
              scene?.prompt ||
              scene?.description ||
              "",

            type:
              scene?.generatedType ||
              scene?.type ||
              "image",

            generatedUrl:
              scene?.generatedUrl ||
              scene?.image ||
              scene?.video ||
              null,

            generatedId:
              scene?.generatedId ||
              null,

            character:
              scene?.character
                ? {
                    id:
                      scene.character
                        .id || null,

                    name:
                      scene.character
                        .name || "",

                    image:
                      scene.character
                        .image ||
                      scene.character
                        .imageUrl ||
                      null,
                  }
                : null,
          }),
        ),
      };

      /*
       * The backend creates the Video record.
       */
      const response = await api.post(
        "/videos",
        payload,
      );

      const savedVideo =
        response.data?.data?.video ||
        response.data?.video ||
        response.data?.data ||
        null;

      if (!savedVideo) {
        throw new Error(
          "Video generation was requested, but no video record was returned.",
        );
      }

      const normalizedVideo =
        normalizeVideo(
          savedVideo,
          projectId,
        );

      if (!normalizedVideo) {
        throw new Error(
          "The video record returned by the server could not be processed.",
        );
      }

      const result = {
        ...normalizedVideo,

        id: normalizedVideo.id,

        type:
          normalizedVideo.type ||
          "video",

        url:
          normalizedVideo.url ||
          null,

        aspectRatio:
          normalizedVideo.aspectRatio ||
          aspectRatio,

        quality:
          normalizedVideo.quality ||
          quality,

        duration:
          normalizedVideo.duration ??
          duration,

        sceneCount:
          normalizedVideo.sceneCount ??
          sceneCount,

        projectId:
          normalizedVideo.projectId ||
          projectId,

        createdAt:
          normalizedVideo.createdAt ||
          new Date().toISOString(),
      };

      setGeneratedVideo(result);

      /*
       * Tell ProjectWorkspace about the
       * successfully created video.
       */
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

  return (
    <div className="space-y-6">
      {/* --------------------------------
          Header
      --------------------------------- */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
            <Film
              size={21}
              className="text-purple-400"
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white">
              Create Video
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Turn your generated scenes into
              a complete AI video.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------
          Saved Video Loading
      --------------------------------- */}
      {videoLoading && (
        <div className="flex items-center gap-3 p-4 text-sm border rounded-xl border-zinc-800 bg-zinc-900 text-zinc-500">
          <span className="w-4 h-4 border-2 rounded-full border-zinc-700 border-t-purple-400 animate-spin" />

          <span>
            Loading your latest generated
            video...
          </span>
        </div>
      )}

      {/* --------------------------------
          Saved Video Error
      --------------------------------- */}
      {videoError && (
        <div className="flex items-start gap-3 p-4 text-sm text-red-400 border rounded-xl border-red-500/20 bg-red-500/5">
          <AlertCircle
            size={17}
            className="flex-shrink-0 mt-0.5"
          />

          <div>
            <p className="font-medium">
              Unable to load saved video
            </p>

            <p className="mt-1 text-xs leading-5 text-red-400/80">
              {videoError}
            </p>
          </div>
        </div>
      )}

      {/* --------------------------------
          Project Readiness
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
          icon={CheckCircle2}
          label="Generated Scenes"
          value={`${readyCount}/${sceneCount}`}
          ready={
            sceneCount > 0 &&
            pendingCount === 0
          }
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
          No Storyboard
      --------------------------------- */}
      {sceneCount === 0 && (
        <EmptyVideoState />
      )}

      {/* --------------------------------
          Main Video Workspace
      --------------------------------- */}
      {sceneCount > 0 && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left */}
          <div className="space-y-6">
            {/* Storyboard Sequence */}
            <div className="border rounded-2xl border-zinc-800 bg-zinc-900">
              <div className="flex flex-col gap-3 px-5 py-4 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-white">
                    Storyboard Sequence
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Nebula will use this sequence
                    to create your video.
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
                <VideoSceneList
                  scenes={scenes}
                />
              </div>
            </div>

            {/* Characters */}
            <div className="border rounded-2xl border-zinc-800 bg-zinc-900">
              <div className="px-5 py-4 border-b border-zinc-800">
                <h3 className="font-semibold text-white">
                  Characters in Video
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Characters referenced by your
                  storyboard scenes.
                </p>
              </div>

              <div className="p-5">
                {usedCharacters.length ===
                0 ? (
                  <div className="flex items-center gap-3 p-4 border border-dashed rounded-xl border-zinc-800 bg-zinc-950">
                    <Users
                      size={18}
                      className="text-zinc-600"
                    />

                    <p className="text-xs text-zinc-600">
                      No reusable characters
                      assigned to these scenes.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {usedCharacters.map(
                      (character) => (
                        <div
                          key={character.id}
                          className="flex items-center gap-3 p-3 border rounded-xl border-zinc-800 bg-zinc-950"
                        >
                          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden rounded-lg bg-purple-500/10">
                            {character.image ||
                            character.imageUrl ? (
                              <img
                                src={
                                  character.image ||
                                  character.imageUrl
                                }
                                alt={
                                  character.name ||
                                  "Character"
                                }
                                className="object-cover w-full h-full"
                                loading="lazy"
                              />
                            ) : (
                              <Users
                                size={17}
                                className="text-purple-400"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {character.name ||
                                "Unnamed Character"}
                            </p>

                            <p className="mt-1 text-[11px] text-zinc-600">
                              Reusable character
                            </p>
                          </div>

                          <CheckCircle2
                            size={15}
                            className="flex-shrink-0 ml-auto text-emerald-400"
                          />
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Generation Information */}
            <div className="p-5 border rounded-2xl border-purple-500/20 bg-purple-500/5">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={18}
                  className="flex-shrink-0 mt-0.5 text-purple-400"
                />

                <div>
                  <h3 className="text-sm font-medium text-purple-300">
                    AI Video Generation
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Nebula will use your storyboard
                    prompts, generated visuals,
                    characters and selected settings
                    to create the final video.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <VideoSettings
              aspectRatio={aspectRatio}
              onAspectRatioChange={
                setAspectRatio
              }
              quality={quality}
              onQualityChange={setQuality}
              duration={duration}
              onDurationChange={setDuration}
            />

            {/* Generate */}
            <div className="p-5 border rounded-2xl border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">
                    Final Generation
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    {pendingCount === 0
                      ? "Everything is ready."
                      : "Complete all scenes first."}
                  </p>
                </div>

                <Film
                  size={18}
                  className="text-purple-400"
                />
              </div>

              <button
                type="button"
                onClick={
                  handleGenerateVideo
                }
                disabled={!canGenerate}
                className="flex items-center justify-center w-full gap-2 px-5 py-3.5 text-sm font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={17} />

                {isGenerating
                  ? "Generating Video..."
                  : "Generate Final Video"}
              </button>

              {!projectId && (
                <p className="mt-3 text-[11px] text-red-400">
                  Project information is
                  missing.
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

              {pendingCount > 0 && (
                <div className="flex items-start gap-2 mt-3">
                  <AlertCircle
                    size={14}
                    className="flex-shrink-0 mt-0.5 text-amber-400"
                  />

                  <p className="text-[11px] leading-5 text-zinc-600">
                    Generate all storyboard
                    scenes before creating the
                    final video.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Summary */}
            <div className="p-5 border rounded-2xl border-zinc-800 bg-zinc-900">
              <h3 className="text-sm font-semibold text-white">
                Video Summary
              </h3>

              <div className="mt-4 space-y-3">
                <SummaryRow
                  label="Scenes"
                  value={sceneCount}
                />

                <SummaryRow
                  label="Characters"
                  value={
                    usedCharacters.length
                  }
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
                      ? "Automatic"
                      : duration
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------
          Generated Video
      --------------------------------- */}
      {generatedVideo && (
        <div className="border rounded-2xl border-zinc-800 bg-zinc-900">
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
                Your complete AI-generated video
                is ready.
              </p>
            </div>

            <span className="px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-400 bg-emerald-500/10">
              Complete
            </span>
          </div>

          <div className="p-5">
            {generatedVideo.url ? (
              <VideoPreview
                video={generatedVideo}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed rounded-xl border-zinc-800">
                <Video
                  size={28}
                  className="text-purple-400"
                />

                <p className="mt-3 text-sm font-medium text-white">
                  Video generation completed
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  The video record was created,
                  but the output URL is not
                  available yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
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
    <div className="flex items-center gap-3 p-4 border rounded-xl border-zinc-800 bg-zinc-900">
      <div
        className={`flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl ${
          ready
            ? "bg-emerald-500/10"
            : "bg-zinc-800"
        }`}
      >
        <Icon
          size={18}
          className={
            ready
              ? "text-emerald-400"
              : "text-zinc-500"
          }
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-zinc-600">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-white truncate">
          {value}
        </p>
      </div>

      {ready && (
        <CheckCircle2
          size={15}
          className="flex-shrink-0 ml-auto text-emerald-400"
        />
      )}
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

/*
 * --------------------------------
 * Empty Video State
 * --------------------------------
 */
function EmptyVideoState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center border border-dashed rounded-2xl border-zinc-800 bg-zinc-900/40">
      <div className="flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-purple-500/10">
        <Clapperboard
          size={28}
          className="text-purple-400"
        />
      </div>

      <h3 className="text-xl font-semibold text-white">
        Build your storyboard first
      </h3>

      <p className="max-w-md mt-2 text-sm leading-6 text-zinc-500">
        Your final video is generated from
        your storyboard scenes. Create and
        generate at least one scene before
        coming here.
      </p>

      <div className="flex items-center gap-2 mt-5 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <Clapperboard size={13} />
          Storyboard
        </span>

        <ArrowRight size={13} />

        <span className="flex items-center gap-1.5">
          <ImageIcon size={13} />
          Generate
        </span>

        <ArrowRight size={13} />

        <span className="flex items-center gap-1.5">
          <Video size={13} />
          Final Video
        </span>
      </div>
    </div>
  );
}