import { MoreVertical, UserRound } from "lucide-react";

export default function CharacterCard({ character, onSelect, onDelete }) {
  return (
    <div className="overflow-hidden transition border group rounded-2xl border-zinc-800 bg-zinc-950 hover:border-purple-500/50">
      {/* Character Image */}
      <div className="relative aspect-square bg-zinc-900">
        {character.image ? (
          <img
            src={character.image}
            alt={character.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-zinc-600">
            <UserRound size={48} />
          </div>
        )}

        {/* Menu */}
        <button
          type="button"
          className="absolute p-2 transition rounded-lg opacity-0 top-3 right-3 bg-black/70 text-zinc-300 group-hover:opacity-100 hover:text-white"
          onClick={() => onDelete?.(character.id)}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Character Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">
          {character.name}
        </h3>

        <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
          {character.description || "No description added."}
        </p>

        <button
          type="button"
          onClick={() => onSelect?.(character)}
          className="w-full px-4 py-2 mt-4 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-500"
        >
          Use Character
        </button>
      </div>
    </div>
  );
}