import CharacterCard from "./CharacterCard";

export default function CharacterGrid({
  characters = [],
  onSelect,
  onDelete,
}) {
  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center border rounded-2xl border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-center w-16 h-16 mb-4 text-purple-400 rounded-2xl bg-purple-500/10">
          <span className="text-2xl">✦</span>
        </div>

        <h3 className="text-lg font-semibold text-white">
          No characters yet
        </h3>

        <p className="max-w-md mt-2 text-sm text-zinc-500">
          Create your first AI character to reuse them
          across images, videos, and your creative
          projects.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {characters.map((character) => {
        if (!character?.id) {
          return null;
        }

        return (
          <CharacterCard
            key={character.id}
            character={character}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}