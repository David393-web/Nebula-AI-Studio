export const PENDING_VIDEO_KEY = "nebula:pending-video-generation";

export function getPendingVideoGenerations() {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_VIDEO_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch { return []; }
}

export function savePendingVideoGeneration(generationId) {
  try { localStorage.setItem(PENDING_VIDEO_KEY, JSON.stringify([...new Set([...getPendingVideoGenerations(), generationId])])); } catch { /* Recovery is best effort when storage is blocked. */ }
}

export function clearPendingVideoGeneration(generationId) {
  try {
    const remaining = getPendingVideoGenerations().filter((id) => id !== generationId);
    if (remaining.length) localStorage.setItem(PENDING_VIDEO_KEY, JSON.stringify(remaining));
    else localStorage.removeItem(PENDING_VIDEO_KEY);
  } catch { /* Recovery is best effort when storage is blocked. */ }
}

function delay(intervalMs, signal) {
  return new Promise((resolve, reject) => {
    const onAbort = () => { clearTimeout(timer); reject(new Error("Status checking was paused.")); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", onAbort); resolve(); }, intervalMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function waitForVideoGeneration(api, generationId, onStatus = () => {}, { intervalMs = 15000, signal } = {}) {
  let missingChecks = 0;
  for (;;) {
    if (signal?.aborted) throw new Error("Status checking was paused. Resume this generation from its saved status.");
    let response;
    try { response = await api.get(`/generation/video/status/${encodeURIComponent(generationId)}`); }
    catch (error) {
      if (error.response?.status === 404) {
        missingChecks += 1;
        if (missingChecks >= 20) {
          onStatus({ generationId, state: "submission_unknown", message: "The original request has not registered a task record yet. Its acceptance is uncertain; do not submit another request with different details." });
          throw new Error("The original video request is still unconfirmed. Keep its generation ID and check its status before retrying.");
        }
        onStatus({ generationId, state: "checking_submission", message: "Waiting for the original request to register. Checking status without resubmitting…" });
        await delay(intervalMs, signal);
        continue;
      }
      if (!error.response || error.response.status === 429 || error.response.status >= 500) {
        onStatus({ generationId, state: "uncertain", message: "Status checking is temporarily unavailable. This request will be checked again without resubmitting." });
        await delay(intervalMs, signal);
        continue;
      }
      throw error;
    }
    missingChecks = 0;
    const status = response.data?.data;
    if (!status) throw new Error("Generation status is unavailable. Check its status before submitting another request.");
    onStatus(status);
    if (signal?.aborted) throw new Error("Status checking was paused.");

    if (status.state === "completed" && status.video) {
      clearPendingVideoGeneration(generationId);
      return status.video;
    }
    if (status.state === "failed") {
      clearPendingVideoGeneration(generationId);
      throw new Error(status.message || "Video generation failed.");
    }
    if (["submission_unknown", "expired"].includes(status.state)) {
      throw new Error(status.message || "Provider acceptance is uncertain. Check this generation status; do not submit it again.");
    }
    await delay(intervalMs, signal);
  }
}
