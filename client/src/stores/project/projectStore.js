import { create } from "zustand";

const useProjectStore = create((set) => ({
  projects: [
    {
      id: 1,
      name: "Nike Commercial",
      images: 24,
      videos: 8,
      characters: 3,
      updated: "2 mins ago",
    },
    {
      id: 2,
      name: "Wedding Ad",
      images: 12,
      videos: 4,
      characters: 1,
      updated: "Yesterday",
    },
  ],

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter(
        (project) => project.id !== id
      ),
    })),
}));

export default useProjectStore;