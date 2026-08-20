import { useState } from "react";
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
    addCharacter,
    deleteCharacter,
  } = useCharacterStore();

  const addAsset = useAssetStore(
    (state) => state.addAsset,
  );

  const handleCreateCharacter = (character) => {
    const characterData = {
      ...character,
      type: "character",
    };

    /*
     * Keep the character in the Character Store.
     */
    addCharacter(characterData);

    /*
     * Also register the character as a project asset.
     */
    addAsset({
      ...characterData,
      name:
        characterData.name ||
        "Unnamed Character",
    });

    setIsModalOpen(false);
  };

  const handleDeleteCharacter = (id) => {
    deleteCharacter(id);
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
      <CharacterGrid
        characters={characters}
        onDelete={handleDeleteCharacter}
      />

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