import { User, Check } from "lucide-react";
import useCharacterStore from "@/stores/characters/characterStore";

export default function CharacterSelector() {
  const {
    characters,
    selectedCharacter,
    selectCharacter,
    clearCharacter,
  } = useCharacterStore();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">
          Character
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Select a reusable character for this generation.
        </p>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl border-zinc-800 bg-zinc-950">
          <User
            size={28}
            className="mb-3 text-zinc-600"
          />

          <p className="text-sm text-zinc-400">
            No characters available.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {characters.map((character) => {
            const selected =
              selectedCharacter?.id === character.id;

            return (
              <button
                key={character.id}
                type="button"
                onClick={() =>
                  selected
                    ? clearCharacter()
                    : selectCharacter(character)
                }
                className={`relative flex items-center gap-3 p-3 text-left transition border rounded-xl ${
                  selected
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-lg bg-zinc-800">
                  {character.image ? (
                    <img
                      src={character.image}
                      alt={character.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <User
                      size={20}
                      className="text-zinc-500"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-white">
                    {character.name}
                  </p>

                  <p className="mt-1 text-xs truncate text-zinc-500">
                    {character.description}
                  </p>
                </div>

                {selected && (
                  <div className="absolute flex items-center justify-center w-5 h-5 bg-purple-600 rounded-full top-2 right-2">
                    <Check size={13} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedCharacter && (
        <div className="flex items-center justify-between px-3 py-2 text-sm border rounded-lg border-purple-500/20 bg-purple-500/5">
          <span className="text-zinc-400">
            Selected:
            <span className="ml-1 font-medium text-purple-400">
              {selectedCharacter.name}
            </span>
          </span>

          <button
            type="button"
            onClick={clearCharacter}
            className="text-xs text-zinc-500 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}