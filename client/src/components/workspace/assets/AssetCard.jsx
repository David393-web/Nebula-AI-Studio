import {
  Image as ImageIcon,
  Video,
  User,
  MoreVertical,
  Trash2,
  Download,
} from "lucide-react";

export default function AssetCard({
  asset,
  onSelect,
  onDelete,
}) {
  const isVideo = asset.type === "video";
  const isCharacter = asset.type === "character";

  const TypeIcon = isVideo
    ? Video
    : isCharacter
      ? User
      : ImageIcon;

  const handleDelete = (event) => {
    event.stopPropagation();

    if (onDelete) {
      onDelete(asset.id);
    }
  };

  const handleDownload = (event) => {
    event.stopPropagation();

    if (!asset.url) return;

    const link = document.createElement("a");
    link.href = asset.url;
    link.download = asset.name || "nebula-asset";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={() => onSelect?.(asset)}
      className="overflow-hidden transition border cursor-pointer group rounded-2xl border-zinc-800 bg-zinc-900 hover:border-purple-500/50"
    >
      {/* Preview */}
      <div className="relative overflow-hidden aspect-square bg-zinc-950">
        {isVideo ? (
          <video
            src={asset.url}
            className="object-cover w-full h-full"
            muted
            playsInline
            preload="metadata"
          />
        ) : asset.url ? (
          <img
            src={asset.url}
            alt={asset.name || "Generated asset"}
            className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <TypeIcon
              size={36}
              className="text-zinc-600"
            />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white border rounded-lg top-3 left-3 border-white/10 bg-black/60 backdrop-blur-sm">
          <TypeIcon size={13} />

          <span className="capitalize">
            {asset.type || "image"}
          </span>
        </div>

        {/* Hover actions */}
        <div className="absolute flex items-center gap-2 transition-opacity opacity-0 top-3 right-3 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center text-white border rounded-lg w-9 h-9 border-white/10 bg-black/60 backdrop-blur-sm hover:bg-purple-600"
            title="Download"
          >
            <Download size={16} />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center text-white border rounded-lg w-9 h-9 border-white/10 bg-black/60 backdrop-blur-sm hover:bg-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-medium text-white truncate">
              {asset.name || "Untitled Asset"}
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              {asset.createdAt
                ? new Date(
                    asset.createdAt
                  ).toLocaleDateString()
                : "Recently created"}
            </p>
          </div>

          <button
            type="button"
            onClick={(event) =>
              event.stopPropagation()
            }
            className="flex-shrink-0 text-zinc-500 hover:text-white"
            title="More options"
          >
            <MoreVertical size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}