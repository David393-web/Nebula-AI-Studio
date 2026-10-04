import api from "@/services/api";

export async function getImages() {
  const { data } = await api.get("/images");
  return data?.data?.images || [];
}

export async function getVideos() {
  const { data } = await api.get("/videos");
  return data?.data?.videos || [];
}

export async function updateImage(id, changes) {
  const { data } = await api.patch(`/images/${id}`, changes);
  return data?.data?.image;
}

export async function deleteImage(id) {
  await api.delete(`/images/${id}`);
}

export async function deleteVideo(id) {
  await api.delete(`/videos/${id}`);
}

export async function createImage(image) {
  const { data } = await api.post("/images", image);
  return data?.data?.image;
}
