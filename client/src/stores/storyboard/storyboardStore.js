import { create } from "zustand";

import {
  getProjectStoryboard,
  createStoryboard as createStoryboardApi,
  updateStoryboard as updateStoryboardApi,
  deleteStoryboard as deleteStoryboardApi,
} from "../../services/storyboard";

const useStoryboardStore = create((set) => ({
  storyboard: null,
  scenes: [],
  loading: false,
  saving: false,
  error: null,

  // ---------------------------------------
  // LOAD PROJECT STORYBOARD
  // ---------------------------------------
  fetchStoryboard: async (projectId) => {
    if (!projectId) {
      return;
    }

    set({
      loading: true,
      error: null,
    });

    try {
      const storyboard = await getProjectStoryboard(projectId);

      set({
        storyboard,
        scenes: Array.isArray(storyboard?.scenes)
          ? storyboard.scenes
          : [],
        loading: false,
      });

      return storyboard;
    } catch (error) {
      console.error("Failed to fetch storyboard:", error);

      // A project may not have a storyboard yet.
      // Treat a 404 as an empty storyboard.
      if (error.response?.status === 404) {
        set({
          storyboard: null,
          scenes: [],
          loading: false,
          error: null,
        });

        return null;
      }

      set({
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load storyboard.",
      });

      throw error;
    }
  },

  // ---------------------------------------
  // CREATE STORYBOARD
  // ---------------------------------------
  createStoryboard: async (projectId, data = {}) => {
    if (!projectId) {
      throw new Error("Project ID is required.");
    }

    set({
      saving: true,
      error: null,
    });

    try {
      const storyboard = await createStoryboardApi({
        name: data.name || "Main Storyboard",
        description: data.description || null,
        projectId,
        scenes: Array.isArray(data.scenes) ? data.scenes : [],
        imageUrl: data.imageUrl || null,
        metadata: data.metadata || null,
      });

      set({
        storyboard,
        scenes: Array.isArray(storyboard?.scenes)
          ? storyboard.scenes
          : [],
        saving: false,
      });

      return storyboard;
    } catch (error) {
      console.error("Failed to create storyboard:", error);

      set({
        saving: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create storyboard.",
      });

      throw error;
    }
  },

  // ---------------------------------------
  // SAVE SCENES
  // ---------------------------------------
  saveScenes: async (projectId, scenes) => {
    if (!projectId) {
      throw new Error("Project ID is required.");
    }

    if (!Array.isArray(scenes)) {
      throw new Error("Scenes must be an array.");
    }

    set({
      saving: true,
      error: null,
    });

    try {
      const currentStoryboard = useStoryboardStore.getState().storyboard;

      let storyboard;

      if (currentStoryboard?.id) {
        storyboard = await updateStoryboardApi(
          currentStoryboard.id,
          {
            scenes,
          }
        );
      } else {
        storyboard = await createStoryboardApi({
          name: "Main Storyboard",
          description: null,
          projectId,
          scenes,
          imageUrl: null,
          metadata: null,
        });
      }

      set({
        storyboard,
        scenes: Array.isArray(storyboard?.scenes)
          ? storyboard.scenes
          : scenes,
        saving: false,
      });

      return storyboard;
    } catch (error) {
      console.error("Failed to save storyboard:", error);

      set({
        saving: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to save storyboard.",
      });

      throw error;
    }
  },

  // ---------------------------------------
  // DELETE STORYBOARD
  // ---------------------------------------
  deleteStoryboard: async () => {
    const currentStoryboard =
      useStoryboardStore.getState().storyboard;

    if (!currentStoryboard?.id) {
      return;
    }

    set({
      saving: true,
      error: null,
    });

    try {
      await deleteStoryboardApi(currentStoryboard.id);

      set({
        storyboard: null,
        scenes: [],
        saving: false,
      });
    } catch (error) {
      console.error("Failed to delete storyboard:", error);

      set({
        saving: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete storyboard.",
      });

      throw error;
    }
  },

  // ---------------------------------------
  // LOCAL STATE HELPERS
  // ---------------------------------------
  setScenes: (scenes) => {
    set({
      scenes: Array.isArray(scenes) ? scenes : [],
    });
  },

  clearStoryboard: () => {
    set({
      storyboard: null,
      scenes: [],
      loading: false,
      saving: false,
      error: null,
    });
  },
}));

export default useStoryboardStore;