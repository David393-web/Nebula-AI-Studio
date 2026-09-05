import { useState } from "react";
import { Image, Video, Sparkles } from "lucide-react";

import PromptBox from "./PromptBox";
import GenerationSettings from "./GenerationSettings";
import ReferenceImages from "./ReferenceImages";
import NegativePrompt from "./NegativePrompt";
import GenerationPreview from "./GenerationPreview";
import GenerationHistory from "./GenerationHistory";
import CharacterSelector from "../characters/CharacterSelector";

import { generateAIImage } from "@/api/generationApi";

import useGenerationStore from "@/stores/generation/generationStore";
import useCharacterStore from "@/stores/characters/characterStore";
import useAssetStore from "@/stores/assets/assetStore";

export default function GeneratePanel({
  scene = null,
  onGenerationComplete,
}) {
  const [type, setType] = useState(scene?.type || "image");

  const [prompt, setPrompt] = useState(
    scene?.prompt || "",
  );

  const [negativePrompt, setNegativePrompt] = useState("");

  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const { model, ratio, quality } =
    useGenerationStore();

  const {
    selectedCharacter,
    selectCharacter,
    clearCharacter,
  } = useCharacterStore();

  const addAsset = useAssetStore(
    (state) => state.addAsset,
  );

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      /*
       * Currently the connected generation API
       * supports image generation.
       */
      if (type !== "image") {
        throw new Error(
          "Video generation is not connected yet.",
        );
      }

      const generationResponse =
        await generateAIImage({
          prompt: prompt.trim(),
          model,
          ratio,
          quality,
          character: selectedCharacter,
        });

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
          `Generated Image`,

        type: "image",

        url: generatedUrl,

        prompt: prompt.trim(),

        negativePrompt,

        model,

        ratio,

        quality,

        character: selectedCharacter
          ? {
              id: selectedCharacter.id,
              name: selectedCharacter.name,
              description:
                selectedCharacter.description || "",
              image:
                selectedCharacter.image ||
                selectedCharacter.imageUrl ||
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
      console.error(
        "Generation failed:",
        generationError,
      );

      setError(
        generationError?.message ||
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
      </div>

      {/* Image / Video Selector */}
      <div className="flex gap-2 p-1 border w-fit rounded-xl bg-zinc-900 border-zinc-800">
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

        <button
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

      {/* Generation Error */}
      {error && (
        <div className="p-4 text-sm text-red-400 border rounded-xl border-red-500/20 bg-red-500/10">
          {error}
        </div>
      )}

      {/* Main Generator */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Side */}
        <div className="space-y-6">
          {/* Character Selector */}
          <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <CharacterSelector />
          </div>

          {/* Prompt */}
          <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <PromptBox
              initialPrompt={prompt}
              onPromptChange={setPrompt}
            />
          </div>

          {/* Reference Images */}
          <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <ReferenceImages />
          </div>

          {/* Negative Prompt */}
          <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <NegativePrompt
              onNegativePromptChange={
                setNegativePrompt
              }
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={
              loading || !prompt.trim()
            }
            className="flex items-center justify-center w-full gap-2 px-6 py-4 font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} />

            {loading
              ? "Generating..."
              : `Generate ${
                  type === "image"
                    ? "Image"
                    : "Video"
                }`}
          </button>
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          {/* Generation Settings */}
          <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
            <GenerationSettings />
          </div>

          {/* Generation Preview */}
          <GenerationPreview
            result={result?.url}
            type={result?.type || type}
            loading={loading}
          />
        </div>
      </div>

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