import { useMemo, useState } from "react";
import {
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Clapperboard,
  Users,
} from "lucide-react";

export default function AssemblyPanel({
  scenes = [],
}) {
  const [isGenerating, setIsGenerating] =
    useState(false);

  const [finalVideo, setFinalVideo] =
    useState(null);

  const generatedScenes = useMemo(
    () =>
      scenes.filter(
        (scene) => scene?.generatedUrl,
      ),
    [scenes],
  );

  const missingScenes = useMemo(
    () =>
      scenes.filter(
        (scene) => !scene?.generatedUrl,
      ),
    [scenes],
  );

  const totalScenes = scenes.length;

  const canGenerate =
    totalScenes > 0 &&
    missingScenes.length === 0 &&
    !isGenerating;

  const handleGenerateVideo = async () => {
    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);
    setFinalVideo(null);

    try {
      /*
       * Temporary mock assembly.
       *
       * This will later call the real video
       * generation / assembly backend.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 2500),
      );

      setFinalVideo({
        id: Date.now(),
        type: "video",
        url:
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        createdAt: new Date(),
      });
    } catch (error) {
      console.error(
        "Video generation failed:",
        error,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Film
            size={22}
            className="text-purple-400"
          />

          <h2 className="text-2xl font-semibold text-white">
            Video Assembly
          </h2>
        </div>

        <p className="max-w-2xl mt-1 text-sm text-zinc-500">
          Turn your generated storyboard scenes and
          characters into one complete AI-generated video.
        </p>
      </div>

      {/* Project Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatusCard
          icon={Clapperboard}
          label="Storyboard Scenes"
          value={totalScenes}
        />

        <StatusCard
          icon={CheckCircle2}
          label="Generated"
          value={generatedScenes.length}
        />

        <StatusCard
          icon={AlertCircle}
          label="Needs Generation"
          value={missingScenes.length}
        />
      </div>

      {/* Empty State */}
      {totalScenes === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[420px] p-8 text-center border border-dashed rounded-2xl border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-purple-500/10">
            <Film
              size={28}
              className="text-purple-400"
            />
          </div>

          <h3 className="text-xl font-semibold text-white">
            Your video starts with a storyboard
          </h3>

          <p className="max-w-md mt-2 text-sm leading-6 text-zinc-500">
            Create scenes in your Storyboard first.
            Once those scenes have been generated, Nebula
            can turn them into a complete video.
          </p>
        </div>
      )}

      {/* Generation Required */}
      {totalScenes > 0 &&
        missingScenes.length > 0 && (
          <div className="p-5 border rounded-2xl border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="flex-shrink-0 mt-0.5 text-amber-400"
              />

              <div>
                <h3 className="text-sm font-semibold text-amber-300">
                  Some scenes still need to be generated
                </h3>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Generate all storyboard scenes before
                  creating the final video.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {missingScenes.map(
                (scene, index) => (
                  <div
                    key={scene.id || index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950"
                  >
                    <span className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-semibold rounded-lg text-zinc-500 bg-zinc-900">
                      {String(
                        scenes.indexOf(scene) + 1,
                      ).padStart(2, "0")}
                    </span>

                    <span className="text-sm truncate text-zinc-300">
                      {scene.title ||
                        `Scene ${index + 1}`}
                    </span>

                    <span className="ml-auto text-xs text-amber-400">
                      Not generated
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

      {/* Scene Sequence */}
      {totalScenes > 0 && (
        <div className="border rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-white">
                Generation Sequence
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Your storyboard order will be used to
                generate the final video.
              </p>
            </div>

            <span className="px-2.5 py-1 text-xs font-medium rounded-lg text-purple-400 bg-purple-500/10">
              {totalScenes}{" "}
              {totalScenes === 1
                ? "Scene"
                : "Scenes"}
            </span>
          </div>

          <div className="p-4 space-y-2">
            {scenes.map((scene, index) => {
              const generated =
                Boolean(scene?.generatedUrl);

              return (
                <div
                  key={scene.id || index}
                  className="flex items-center gap-3 p-3 border rounded-xl border-zinc-800 bg-zinc-950"
                >
                  {/* Number */}
                  <div className="flex items-center justify-center flex-shrink-0 text-xs font-semibold rounded-lg w-9 h-9 text-zinc-500 bg-zinc-900">
                    {String(index + 1).padStart(
                      2,
                      "0",
                    )}
                  </div>

                  {/* Preview */}
                  <div className="flex items-center justify-center flex-shrink-0 w-16 h-10 overflow-hidden rounded-lg bg-zinc-900">
                    {generated &&
                    scene.generatedType ===
                      "video" ? (
                      <video
                        src={scene.generatedUrl}
                        className="object-cover w-full h-full"
                        muted
                      />
                    ) : generated ? (
                      <img
                        src={scene.generatedUrl}
                        alt={
                          scene.title ||
                          "Generated scene"
                        }
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Clapperboard
                        size={17}
                        className="text-zinc-600"
                      />
                    )}
                  </div>

                  {/* Scene Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {scene.title ||
                        `Scene ${index + 1}`}
                    </p>

                    <p className="mt-1 text-xs truncate text-zinc-600">
                      {scene.prompt ||
                        "No generation prompt"}
                    </p>
                  </div>

                  {/* Character */}
                  {scene.character && (
                    <div className="hidden items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 sm:flex">
                      <Users
                        size={12}
                        className="text-purple-400"
                      />

                      <span className="max-w-[100px] text-[10px] text-purple-400 truncate">
                        {scene.character.name}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  {generated ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-emerald-400">
                      <CheckCircle2 size={14} />
                      Ready
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-amber-400">
                      <AlertCircle size={14} />
                      Pending
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Final Video */}
      {totalScenes > 0 && (
        <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles
                  size={18}
                  className="text-purple-400"
                />

                <h3 className="font-semibold text-white">
                  Generate Final Video
                </h3>
              </div>

              <p className="max-w-xl mt-1 text-sm leading-6 text-zinc-500">
                Nebula will use your generated scenes,
                characters and storyboard sequence to
                create the final video.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={!canGenerate}
              className="flex items-center justify-center flex-shrink-0 gap-2 px-6 py-3 text-sm font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={16} />

              {isGenerating
                ? "Generating Video..."
                : "Generate Video"}
            </button>
          </div>
        </div>
      )}

      {/* Final Video */}
      {finalVideo && (
        <div className="border rounded-2xl border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-white">
                Generated Video
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Your final AI-generated video.
              </p>
            </div>

            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg text-emerald-400 bg-emerald-500/10">
              <CheckCircle2 size={13} />
              Complete
            </span>
          </div>

          <div className="p-5">
            <div className="relative overflow-hidden bg-black rounded-xl aspect-video">
              <video
                src={finalVideo.url}
                controls
                className="object-contain w-full h-full"
              />

              <div className="absolute flex items-center justify-center w-10 h-10 rounded-full pointer-events-none top-3 left-3 bg-black/60">
                <Play
                  size={17}
                  className="text-white"
                  fill="currentColor"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3 p-4 border rounded-xl border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/10">
        <Icon
          size={18}
          className="text-purple-400"
        />
      </div>

      <div>
        <p className="text-xs text-zinc-600">
          {label}
        </p>

        <p className="mt-1 text-lg font-semibold text-white">
          {value}
        </p>
      </div>
    </div>
  );
}