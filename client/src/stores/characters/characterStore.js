import { create } from "zustand";
import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "@/services/character";

const useCharacterStore = create((set) => ({
  characters: [],
  selectedCharacter: null,

  loading: false,
  error: null,

  /*
   * Load characters from the backend.
   */
  fetchCharacters: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      const characters = await getCharacters();

      set({
        characters,
        loading: false,
      });

      return characters;
    } catch (error) {
      console.error(
        "Failed to fetch characters:",
        error,
      );

      set({
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load characters.",
      });

      throw error;
    }
  },

  /*
   * Select a character for use in the workspace.
   */
  selectCharacter: (character) =>
    set({
      selectedCharacter: character,
    }),

  /*
   * Clear the currently selected character.
   */
  clearCharacter: () =>
    set({
      selectedCharacter: null,
    }),

  /*
   * Create a character through the backend.
   */
  addCharacter: async (characterData) => {
    try {
      const character =
        await createCharacter(characterData);

      set((state) => ({
        characters: [
          character,
          ...state.characters,
        ],
      }));

      return character;
    } catch (error) {
      console.error(
        "Failed to create character:",
        error,
      );

      throw error;
    }
  },

  /*
   * Update an existing character.
   */
  updateCharacter: async (
    id,
    characterData,
  ) => {
    try {
      const updatedCharacter =
        await updateCharacter(
          id,
          characterData,
        );

      set((state) => ({
        characters: state.characters.map(
          (character) =>
            character.id === id
              ? updatedCharacter
              : character,
        ),

        selectedCharacter:
          state.selectedCharacter?.id === id
            ? updatedCharacter
            : state.selectedCharacter,
      }));

      return updatedCharacter;
    } catch (error) {
      console.error(
        "Failed to update character:",
        error,
      );

      throw error;
    }
  },

  /*
   * Delete a character through the backend.
   */
  deleteCharacter: async (id) => {
    try {
      await deleteCharacter(id);

      set((state) => ({
        characters: state.characters.filter(
          (character) =>
            character.id !== id,
        ),

        selectedCharacter:
          state.selectedCharacter?.id === id
            ? null
            : state.selectedCharacter,
      }));
    } catch (error) {
      console.error(
        "Failed to delete character:",
        error,
      );

      throw error;
    }
  },

  /*
   * Clear any store error.
   */
  clearError: () =>
    set({
      error: null,
    }),
}));

export default useCharacterStore;