import { create } from "zustand";

const getStoredAssets = () => {
  try {
    const stored = localStorage.getItem(
      "nebula-assets",
    );

    return stored
      ? JSON.parse(stored)
      : [];
  } catch (error) {
    console.error(
      "Failed to load assets:",
      error,
    );

    return [];
  }
};

const saveAssets = (assets) => {
  try {
    localStorage.setItem(
      "nebula-assets",
      JSON.stringify(assets),
    );
  } catch (error) {
    console.error(
      "Failed to save assets:",
      error,
    );
  }
};

const useAssetStore = create((set) => ({
  assets: getStoredAssets(),

  addAsset: (asset) =>
    set((state) => {
      const assets = [
        asset,
        ...state.assets,
      ];

      saveAssets(assets);

      return {
        assets,
      };
    }),

  addAssets: (newAssets) =>
    set((state) => {
      const assets = [
        ...newAssets,
        ...state.assets,
      ];

      saveAssets(assets);

      return {
        assets,
      };
    }),

  deleteAsset: (id) =>
    set((state) => {
      const assets =
        state.assets.filter(
          (asset) => asset.id !== id,
        );

      saveAssets(assets);

      return {
        assets,
      };
    }),

  clearAssets: () => {
    saveAssets([]);

    set({
      assets: [],
    });
  },
}));

export default useAssetStore;