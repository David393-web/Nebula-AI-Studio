# Private media storage

## Supabase Storage

When both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured on the Node API, generated images and videos are uploaded to the private bucket named by `SUPABASE_MEDIA_BUCKET` (default `nebula-media`). The service-role key is read only by the backend provider and is never returned in API responses. If both credentials are absent, the application continues to use local disk storage. If only one is configured, storage fails fast rather than silently switching providers.

The backend first saves a local fallback copy, then uploads to Supabase. A failed Supabase upload fails media persistence and the generation's existing failure/refund path; it does not write a successful media record. On success, `Image` and `Video` records store the private object path, bucket, provider, MIME type, size, generation ID, and owner user ID in their existing JSON `metadata`; the relational `userId` remains authoritative. The record URL remains the application's authenticated `/api/images/:id/media` or `/api/videos/:id/media` route. That route checks ownership and redirects to a signed URL valid for 60 seconds. Downloads use the same check and add a sanitized download filename.

Existing records and local files are not migrated or deleted. Old records whose storage provider is absent continue to resolve local storage keys and legacy `/uploads/...` paths. New Supabase-backed records also retain their local copy as a fallback. There is no automatic migration or cleanup job; monitor storage growth and decide retention/backups deliberately.

## Supabase free-tier constraints

Supabase currently lists 1 GB Storage size and 5 GB egress on its Free plan, with a 50 MB maximum file size. The application defaults `SUPABASE_MEDIA_MAX_FILE_BYTES` to 50 MiB and rejects larger video files before downloading them when Supabase is configured. Keep the bucket and global Storage limit at 50 MB on Free. Do not increase the environment limit unless the Supabase project actually permits the same limit; this application uses the standard object upload endpoint with retries. The official docs recommend resumable uploads for files above 6 MB for better reliability, so large video support beyond this bounded standard upload path should be added with TUS before raising limits.

Storage quotas and egress are shared with the existing Supabase project and may be consumed by other project data. Check the Supabase organization Usage page before bulk migration or sustained video uploads. No paid service or plan change is required or performed by this code.

## Render API configuration

Set these variables in the Render API service's Environment page, then redeploy:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<backend-only service_role secret>
SUPABASE_MEDIA_BUCKET=nebula-media
SUPABASE_MEDIA_MAX_FILE_BYTES=52428800
```

Use the existing Supabase project URL and service-role key from the Supabase dashboard. Keep the service-role value only in Render's backend environment; never add it to Vercel, any `VITE_*` variable, browser code, or a committed `.env` file. Existing `DATABASE_URL` and `DIRECT_URL` continue to configure Prisma/PostgreSQL; Storage does not add a database or dependency.

## Supabase dashboard setup

1. Open the existing project and choose **Storage**.
2. Choose **New bucket**, name it `nebula-media`, and leave **Public bucket** disabled.
3. Set the bucket's allowed MIME types to `image/jpeg`, `image/png`, `image/webp`, `image/bmp`, `video/mp4`, and `video/webm` (adjust only if your configured providers return other media types).
4. Set the bucket's maximum file size to 50 MB. In **Storage settings**, verify the global maximum file size is also at least 50 MB (Free projects cannot set it higher than 50 MB).
5. Do not add an anonymous/public read policy. The backend service role performs uploads and signs private reads after the API verifies media ownership.
6. Copy the project URL and backend service-role key into the matching Render variables above. Redeploy Render, then verify by generating a small image and video and checking the private bucket and authenticated playback/download routes.

No Prisma migration is required. Image and video model metadata is already JSON and already has the owner relationship needed for authorization.
