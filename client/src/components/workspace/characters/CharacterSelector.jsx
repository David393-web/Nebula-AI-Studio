import { useEffect } from "react";
import {
  User,
  Check,
} from "lucide-react";

import useCharacterStore from "@/stores/characters/characterStore";

export default function CharacterSelector() {
  const {
    characters,
    selectedCharacter,
    selectCharacter,
    clearCharacter,
    fetchCharacters,
    loading,
  } = useCharacterStore();

  /*
   * Make sure the selector has the latest
   * characters from the backend.
   *
   * This is important when the user opens
   * Generate directly without visiting
   * the Characters panel first.
   */
  useEffect(() => {
    if (characters.length === 0) {
      fetchCharacters().catch(() => {
        // Store handles the error state.
      });
    }
  }, [characters.length, fetchCharacters]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">
          Character
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Select a reusable character for this
          generation.
        </p>
      </div>

      {/* Loading */}
      {loading && characters.length === 0 ? (
        <div className="flex items-center justify-center p-8 border rounded-xl border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <div className="w-4 h-4 border-2 rounded-full border-zinc-700 border-t-purple-500 animate-spin" />
            Loading characters...
          </div>
        </div>
      ) : characters.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl border-zinc-800 bg-zinc-950">
          <User
            size={28}
            className="mb-3 text-zinc-600"
          />

          <p className="text-sm text-zinc-400">
            No characters available.
          </p>

          <p className="max-w-xs mt-1 text-xs text-zinc-600">
            Create a character in your Character
            Library to reuse it here.
          </p>
        </div>
      ) : (
        /* Character List */
        <div className="grid gap-3 sm:grid-cols-2">
          {characters.map((character) => {
            const selected =
              selectedCharacter?.id ===
              character.id;

            const imageUrl =
              character?.image ||
              character?.imageUrl ||
              null;

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
                {/* Character Image */}
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 overflow-hidden rounded-lg bg-zinc-800">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={
                        character.name ||
                        "Character"
                      }
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  ) : (
                    <User
                      size={20}
                      className="text-zinc-500"
                    />
                  )}
                </div>

                {/* Character Info */}
                <div className="min-w-0 pr-5">
                  <p className="font-medium text-white truncate">
                    {character.name ||
                      "Unnamed Character"}
                  </p>

                  <p className="mt-1 text-xs truncate text-zinc-500">
                    {character.description ||
                      "No description added."}
                  </p>
                </div>

                {/* Selected Indicator */}
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

      {/* Selected Character */}
      {selectedCharacter && (
        <div className="flex items-center justify-between px-3 py-2 text-sm border rounded-lg border-purple-500/20 bg-purple-500/5">
          <span className="text-zinc-400">
            Selected:
            <span className="ml-1 font-medium text-purple-400">
              {selectedCharacter.name ||
                "Unnamed Character"}
            </span>
          </span>

          <button
            type="button"
            onClick={clearCharacter}
            className="text-xs transition text-zinc-500 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}