import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";

import CharacterGrid from "./CharacterGrid";
import CreateCharacterModal from "./CreateCharacterModal";

import useCharacterStore from "@/stores/characters/characterStore";
import useAssetStore from "@/stores/assets/assetStore";

export default function CharactersPanel() {
  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const {
    characters,
    selectedCharacter,
    loading,
    error,
    fetchCharacters,
    addCharacter,
    deleteCharacter,
    selectCharacter,
    clearCharacter,
    clearError,
  } = useCharacterStore();

  const addAsset = useAssetStore(
    (state) => state.addAsset,
  );

  useEffect(() => {
    fetchCharacters().catch(() => {
      // Store handles the error state.
    });
  }, [fetchCharacters]);

  const handleCreateCharacter = async (
    character,
  ) => {
    try {
      clearError();

      const characterData = {
        ...character,
        type: "character",
      };

      const createdCharacter =
        await addCharacter(characterData);

      if (createdCharacter) {
        addAsset({
          ...createdCharacter,
          name:
            createdCharacter.name ||
            "Unnamed Character",
          type: "character",
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error(
        "Failed to create character:",
        error,
      );
    }
  };

  const handleDeleteCharacter = async (id) => {
    try {
      clearError();

      await deleteCharacter(id);
    } catch (error) {
      console.error(
        "Failed to delete character:",
        error,
      );
    }
  };

  const handleSelectCharacter = (character) => {
    selectCharacter(character);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users
              size={22}
              className="text-purple-400"
            />

            <h2 className="text-2xl font-semibold text-white">
              Characters
            </h2>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            Create reusable AI characters for your
            images and videos.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsModalOpen(true)
          }
          className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700"
        >
          <Plus size={18} />
          Create Character
        </button>
      </div>

      {/* Selected Character */}
      {selectedCharacter && (
        <div className="flex items-center justify-between gap-4 p-4 border rounded-xl border-purple-500/30 bg-purple-500/10">
          <div className="flex items-center min-w-0 gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden rounded-lg bg-zinc-900">
              {selectedCharacter.image ||
              selectedCharacter.imageUrl ? (
                <img
                  src={
                    selectedCharacter.image ||
                    selectedCharacter.imageUrl
                  }
                  alt={
                    selectedCharacter.name ||
                    "Selected character"
                  }
                  className="object-cover w-full h-full"
                />
              ) : (
                <Users
                  size={18}
                  className="text-purple-400"
                />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs text-purple-300">
                Selected Character
              </p>

              <p className="font-medium text-white truncate">
                {selectedCharacter.name ||
                  "Unnamed Character"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearCharacter}
            className="flex-shrink-0 text-xs font-medium transition text-zinc-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-4 p-4 text-sm text-red-300 border rounded-xl border-red-500/20 bg-red-500/10">
          <span>{error}</span>

          <button
            type="button"
            onClick={clearError}
            className="text-xs font-medium text-red-200 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Character Count */}
      <div className="flex items-center justify-between p-4 border rounded-xl border-zinc-800 bg-zinc-900">
        <div>
          <p className="text-sm font-medium text-white">
            Character Library
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Characters available in this workspace.
          </p>
        </div>

        <span className="px-3 py-1 text-xs font-medium text-purple-300 rounded-full bg-purple-500/10">
          {characters.length}{" "}
          {characters.length === 1
            ? "Character"
            : "Characters"}
        </span>
      </div>

      {/* Character Grid */}
      {loading && characters.length === 0 ? (
        <div className="flex items-center justify-center p-12 border rounded-xl border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <div className="w-4 h-4 border-2 rounded-full border-zinc-600 border-t-purple-500 animate-spin" />
            Loading characters...
          </div>
        </div>
      ) : (
        <CharacterGrid
          characters={characters}
          onSelect={handleSelectCharacter}
          onDelete={handleDeleteCharacter}
        />
      )}

      {/* Create Modal */}
      <CreateCharacterModal
        isOpen={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        onCreate={handleCreateCharacter}
      />
    </div>
  );
}