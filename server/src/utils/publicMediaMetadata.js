const PRIVATE_STORAGE_FIELDS = new Set([
  "storageProvider",
  "storageBucket",
  "storageKey",
  "localStorageKey",
  "storageSize",
  "storageMimeType",
  "ownerUserId",
]);

function publicMediaMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value ?? null;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !PRIVATE_STORAGE_FIELDS.has(key)));
}

module.exports = publicMediaMetadata;
