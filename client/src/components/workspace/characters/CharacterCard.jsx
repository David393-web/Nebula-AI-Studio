import {
  MoreVertical,
  UserRound,
  Trash2,
} from "lucide-react";

export default function CharacterCard({
  character,
  onSelect,
  onDelete,
}) {
  const imageUrl =
    character?.image ||
    character?.imageUrl ||
    null;

  const handleDelete = () => {
    if (!character?.id) return;

    const confirmed = window.confirm(
      `Delete "${character.name || "this character"}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    onDelete?.(character.id);
  };

  return (
    <div className="overflow-hidden transition border group rounded-2xl border-zinc-800 bg-zinc-950 hover:border-purple-500/50">
      {/* Character Image */}
      <div className="relative aspect-square bg-zinc-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={
              character?.name ||
              "Character"
            }
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-zinc-600">
            <UserRound size={48} />
          </div>
        )}

        {/* Menu */}
        <div className="absolute top-3 right-3">
          <button
            type="button"
            aria-label={`Character options for ${
              character?.name || "character"
            }`}
            className="p-2 transition rounded-lg opacity-0 bg-black/70 text-zinc-300 group-hover:opacity-100 hover:text-white"
            onClick={handleDelete}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Character Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">
          {character?.name ||
            "Unnamed Character"}
        </h3>

        <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
          {character?.description ||
            "No description added."}
        </p>

        <button
          type="button"
          onClick={() =>
            onSelect?.(character)
          }
          className="w-full px-4 py-2 mt-4 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-500"
        >
          Use Character
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-2 text-sm font-medium transition border rounded-lg text-zinc-400 border-zinc-800 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </div>
  );
}