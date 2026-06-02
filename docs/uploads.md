# Upload System (Cloudinary + Custom Domain)

## Overview

This service provides signed uploads to Cloudinary and returns URLs that use your custom domain by proxying through `PUBLIC_BASE_URL`.

## Prerequisites

- DNS CNAME for `images.crossfire.wiki` (or root) pointing to Cloudinary (see Cloudinary docs for exact target)
- Cloudinary dashboard: enable custom domain and map it to your CNAME
- Environment:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `PUBLIC_BASE_URL` set to `https://crossfire.wiki`
  - `PORT=20032`

## Endpoints

- `POST /images/upload`
  - FormData: `file` (binary), optional `folder`, optional `public_id`
  - Headers: `Authorization: Bearer <token>`, `X-CSRF-Token: <token>`
  - Response: `{ ok, secure_url, domain_url, public_id, format, resource_type }`

- `POST /videos/upload`
  - Same as above; defaults `folder=videos`

- `POST /audio/upload`
  - Same as above; defaults `folder=audio`

- `POST /api/events/:id/upload-cloudinary?updateImage=true`
  - FormData: `file`
  - Sets Cloudinary folder to `events/:id`
  - If `updateImage=true`, updates event `image` with `domain_url`

- `POST /api/news/:id/upload-cloudinary?updateImage=true`
  - FormData: `file`
  - Sets Cloudinary folder to `news/:id`
  - If `updateImage=true`, updates news `image`

- `POST /api/posts/:id/upload-cloudinary`
  - FormData: `file`
  - Sets Cloudinary folder to `posts/:id`

- `GET /api/admin/upload-stats`
  - Returns counts and latency metrics (p95/p99)

## Request Formats

- Multipart/Form-Data with single `file` field
- Optional fields: `folder`, `public_id`
- Required headers: `Authorization`, `X-CSRF-Token`

## Responses

Success:

```
{
  "ok": true,
  "secure_url": "https://res.cloudinary.com/<cloud>/...",
  "domain_url": "https://crossfire.wiki/media/cloudinary/<cloud>/...",
  "public_id": "...",
  "format": "webp",
  "resource_type": "image"
}
```

Error:

```
{
  "ok": false,
  "error": "<message>",
  "code": "server_error|unsupported_type|csrf_failed|file_too_large|no_file"
}
```

## Error Handling & Retries

- Signed uploads with up to 3 attempts and exponential backoff
- Returns informative error messages from Cloudinary upstream
- Admin UI guards against non-JSON error bodies to avoid `Unexpected end of JSON input`

## Monitoring

- JSONL upload logs in `backend-deploy-full/logs/upload-events.jsonl`
- `GET /api/admin/upload-stats` exposes success/failure counts and latency (avg/p95/p99)

## Testing Plan

- Unit: verify signature generation and parameter signing
- Integration: hit `/images/upload` with fixtures for image/video/audio and assert `domain_url`
- E2E: simulate Admin upload flow and confirm URL in media library

