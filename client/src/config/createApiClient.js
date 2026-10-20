import axios from "axios";

export function createApiClient(baseURL) {
  return axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
