import { create } from "zustand";

const useGenerationStore = create((set) => ({
  model: "Flux Pro",
  ratio: "1:1",
  quality: "High",

  setModel: (model) =>
    set({ model }),

  setRatio: (ratio) =>
    set({ ratio }),

  setQuality: (quality) =>
    set({ quality }),
}));

export default useGenerationStore;