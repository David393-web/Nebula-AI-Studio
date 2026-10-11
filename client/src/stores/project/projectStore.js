import { create } from "zustand";
import {
  getProjects,
  createProject as createProjectApi,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
} from "../../services/project";

let projectMutationVersion = 0;

const useProjectStore = create((set) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    const requestVersion = projectMutationVersion;
    set({ loading: true, error: null });

    try {
      const projects = await getProjects();

      set((state) => requestVersion === projectMutationVersion
        ? { projects, loading: false }
        : { loading: false, projects: state.projects });
    } catch (error) {
      console.error("Failed to fetch projects:", error);

      set({
        loading: false,
        error: error.response?.data?.message || error.message,
      });
    }
  },

  createProject: async (projectData) => {
    try {
      const project = await createProjectApi(projectData);

      set((state) => ({
        projects: [project, ...state.projects],
      }));

      return project;
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  },

  updateProject: async (id, projectData) => {
    projectMutationVersion += 1;
    try {
      const updatedProject = await updateProjectApi(id, projectData);

      if (!updatedProject) {
        throw new Error("Project update returned no saved project.");
      }
      projectMutationVersion += 1;

      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? { ...project, ...updatedProject } : project
        ),
      }));

      return updatedProject;
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await deleteProjectApi(id);

      set((state) => ({
        projects: state.projects.filter(
          (project) => project.id !== id
        ),
      }));
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  },
}));

export default useProjectStore;
