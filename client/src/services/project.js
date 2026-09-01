import api from "../config/api";

// GET ALL PROJECTS
export async function getProjects() {
  const response = await api.get("/projects");

  return response.data?.data?.projects || [];
}

// GET ONE PROJECT
export async function getProject(id) {
  const response = await api.get(`/projects/${id}`);

  return response.data?.data?.project || null;
}

// CREATE PROJECT
export async function createProject(projectData) {
  const response = await api.post("/projects", projectData);

  return response.data?.data?.project;
}

// UPDATE PROJECT
export async function updateProject(id, projectData) {
  const response = await api.put(`/projects/${id}`, projectData);

  return response.data?.data?.project;
}

// DELETE PROJECT
export async function deleteProject(id) {
  const response = await api.delete(`/projects/${id}`);

  return response.data;
}