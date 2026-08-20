import { create } from "zustand";

const defaultCharacters = [
  {
    id: 1,
    name: "Amara",
    description:
      "A confident Nigerian woman with a cinematic appearance.",
    image: null,
  },
  {
    id: 2,
    name: "David",
    description:
      "A young Nigerian man with a modern cinematic look.",
    image: null,
  },
];

const getStoredCharacters = () => {
  try {
    const stored = localStorage.getItem(
      "nebula-characters",
    );

    return stored
      ? JSON.parse(stored)
      : defaultCharacters;
  } catch (error) {
    console.error(
      "Failed to load characters:",
      error,
    );

    return defaultCharacters;
  }
};

const saveCharacters = (characters) => {
  try {
    localStorage.setItem(
      "nebula-characters",
      JSON.stringify(characters),
    );
  } catch (error) {
    console.error(
      "Failed to save characters:",
      error,
    );
  }
};

const useCharacterStore = create((set) => ({
  characters: getStoredCharacters(),

  selectedCharacter: null,

  selectCharacter: (character) =>
    set({
      selectedCharacter: character,
    }),

  clearCharacter: () =>
    set({
      selectedCharacter: null,
    }),

  addCharacter: (character) =>
    set((state) => {
      const characters = [
        character,
        ...state.characters,
      ];

      saveCharacters(characters);

      return {
        characters,
      };
    }),

  deleteCharacter: (id) =>
    set((state) => {
      const characters =
        state.characters.filter(
          (character) =>
            character.id !== id,
        );

      saveCharacters(characters);

      return {
        characters,
        selectedCharacter:
          state.selectedCharacter?.id === id
            ? null
            : state.selectedCharacter,
      };
    }),
}));

export default useCharacterStore;