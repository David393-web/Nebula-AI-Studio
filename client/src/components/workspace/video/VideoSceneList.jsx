import {
  CheckCircle2,
  AlertCircle,
  Clapperboard,
  Image as ImageIcon,
  Video,
  Users,
} from "lucide-react";

export default function VideoSceneList({
  scenes = [],
}) {
  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-zinc-950">
          <Clapperboard
            size={22}
            className="text-zinc-600"
          />
        </div>

        <p className="text-sm font-medium text-zinc-400">
          No scenes available
        </p>

        <p className="max-w-sm mt-1 text-xs leading-5 text-zinc-600">
          Create scenes in the Storyboard before
          generating your final video.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scenes.map((scene, index) => (
        <SceneRow
          key={scene?.id || index}
          scene={scene}
          index={index}
        />
      ))}
    </div>
  );
}

function SceneRow({ scene, index }) {
  const generated = Boolean(
    scene?.generatedUrl ||
      scene?.image ||
      scene?.video,
  );

  const generatedType =
    scene?.generatedType ||
    scene?.type ||
    "image";

  const character = scene?.character;

  return (
    <div
      className={`group relative flex items-center gap-3 p-3 border rounded-xl transition ${
        generated
          ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
          : "border-amber-500/10 bg-amber-500/[0.02]"
      }`}
    >
      {/* Scene Number */}
      <div
        className={`flex items-center justify-center flex-shrink-0 w-9 h-9 text-xs font-semibold rounded-lg ${
          generated
            ? "text-purple-300 bg-purple-500/10"
            : "text-zinc-500 bg-zinc-900"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Preview */}
      <ScenePreview
        scene={scene}
        generated={generated}
        generatedType={generatedType}
      />

      {/* Scene Information */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">
            {scene?.title ||
              `Scene ${index + 1}`}
          </p>

          {generatedType === "video" ? (
            <Video
              size={13}
              className="flex-shrink-0 text-blue-400"
            />
          ) : (
            <ImageIcon
              size={13}
              className="flex-shrink-0 text-purple-400"
            />
          )}
        </div>

        <p className="mt-1 text-xs text-zinc-600 truncate">
          {scene?.prompt ||
            "No generation prompt"}
        </p>

        {character && (
          <div className="flex items-center gap-1.5 mt-2">
            <Users
              size={11}
              className="text-purple-400"
            />

            <span className="text-[10px] text-zinc-600">
              {character.name}
            </span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        {generated ? (
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-md text-emerald-400 bg-emerald-500/10">
            <CheckCircle2 size={12} />
            Ready
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-md text-amber-400 bg-amber-500/10">
            <AlertCircle size={12} />
            Pending
          </div>
        )}
      </div>
    </div>
  );
}

function ScenePreview({
  scene,
  generated,
  generatedType,
}) {
  const source =
    scene?.generatedUrl ||
    scene?.image ||
    scene?.video ||
    null;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0 w-20 h-12 overflow-hidden rounded-lg bg-zinc-900">
      {generated && source ? (
        generatedType === "video" ? (
          <video
            src={source}
            muted
            preload="metadata"
            className="object-cover w-full h-full"
          />
        ) : (
          <img
            src={source}
            alt={
              scene?.title ||
              "Generated scene"
            }
            className="object-cover w-full h-full"
          />
        )
      ) : (
        <Clapperboard
          size={17}
          className="text-zinc-700"
        />
      )}

      {/* Scene Type Badge */}
      {generated && (
        <div className="absolute bottom-1 right-1 flex items-center justify-center w-5 h-5 rounded bg-black/70">
          {generatedType === "video" ? (
            <Video
              size={10}
              className="text-blue-300"
            />
          ) : (
            <ImageIcon
              size={10}
              className="text-purple-300"
            />
          )}
        </div>
      )}
    </div>
  );
}