const STATUS_TTL_MS = 60 * 60 * 1000;
const statuses = new Map();

function pruneExpired(now = Date.now()) {
  for (const [requestId, entry] of statuses) {
    if (now - entry.updatedAt > STATUS_TTL_MS) statuses.delete(requestId);
  }
}

function update(userId, requestId, state) {
  if (!userId || !requestId) return;
  const now = Date.now();
  pruneExpired(now);
  const current = statuses.get(requestId);
  if (current && current.userId !== userId) return;
  statuses.set(requestId, { userId, ...state, updatedAt: now });
}

function get(userId, requestId) {
  pruneExpired();
  const entry = statuses.get(requestId);
  if (!entry || entry.userId !== userId) return null;
  const { userId: _owner, updatedAt: _updatedAt, ...status } = entry;
  return status;
}

module.exports = { update, get };
