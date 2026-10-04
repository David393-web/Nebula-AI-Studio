import api from "@/services/api";

export async function getSettings(){const {data}=await api.get("/settings");return data?.data?.settings||{};}
export async function updateSettings(changes){const {data}=await api.patch("/settings",changes);return data?.data?.settings||{};}
export async function updateProfile(changes){const {data}=await api.patch("/auth/profile",changes);return data?.data?.user||null;}
export async function changePassword(changes){await api.patch("/auth/password",changes);}
