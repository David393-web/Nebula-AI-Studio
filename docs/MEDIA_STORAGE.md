# Media storage deployment

Generated media is saved under the configured media storage root in a `private/` directory. Database image and video URLs point to authenticated media routes; requests are checked against the signed-in user's ownership before playback or download. Provider URLs are retained separately in record metadata and are not used as the permanent URL.

Set `MEDIA_STORAGE_DIR` on the API server to an absolute directory on a persistent, backed-up volume. The API process needs read and write access. If unset, the server uses `<working directory>/uploads`; that default survives process restarts on a single persistent host but is not durable on ephemeral/serverless filesystems. Every API instance serving media must mount the same shared volume. There is no media cleanup job, so storage growth and retention must be managed by the operator.

Generated image downloads are limited to 20 MB and generated video downloads to 500 MB. Uploads are currently limited to 100 MB. Download and provider fetch failures retry transient errors up to three times; a failed durable write fails the generation and triggers the existing credit refund flow.

Older records continue to use their existing URLs. Old `/uploads/...` files remain viewable and downloadable when present. If an old record contains only an expired provider URL, the authenticated media endpoint reports HTTP 410 and the user needs to regenerate the media; recovery is not possible after the provider retention period.

No database migration is required: the existing JSON metadata field stores the storage key, provider URL, generation ID, media type, and file size. Existing uploads remain at their existing paths.
