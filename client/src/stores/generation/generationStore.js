import { create } from "zustand";

const useGenerationStore = create((set) => ({
  model: "black-forest-labs/flux-2-pro",
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
