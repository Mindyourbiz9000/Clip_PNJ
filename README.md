# QuickClip

A lightweight, database-free web app that generates downloadable MP4 clips from a direct video URL. Paste a link, pick start/end times, choose a format, and download your clip.

## What It Does

1. User pastes a direct video URL (`.mp4` or `.m3u8`)
2. User picks start time, end time, and output format (16:9 / 9:16 / 1:1)
3. Server cuts and encodes the clip with FFmpeg
4. Browser downloads the resulting `quickclip.mp4`

No accounts, no database, no history — just clip and go.

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Or: Node.js 20+ and FFmpeg installed locally

## Quick Start (Docker Compose)

```bash
# Clone the repo
git clone https://github.com/Mindyourbiz9000/Clip_PNJ.git
cd Clip_PNJ

# Copy environment file
cp .env.example .env

# Build and start
docker compose up --build

# Open http://localhost:3000
```

## Local Development (without Docker)

```bash
# Prerequisites: Node.js 20+, FFmpeg installed

npm install
npm run dev

# Open http://localhost:3000
```

## Configuration

All configuration is via environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `MAX_CLIP_SECONDS` | `60` | Maximum clip duration in seconds |
| `FFMPEG_TIMEOUT_SECONDS` | `120` | FFmpeg process timeout |
| `MAX_CONCURRENT` | `1` | Max concurrent FFmpeg processes |
| `TMP_DIR` | `/tmp` | Temporary file directory |
| `PORT` | `3000` | Server port |

## API

### `POST /api/clip`

**Request body (JSON):**

```json
{
  "url": "https://example.com/video.mp4",
  "start": "00:00:10",
  "end": "00:00:40",
  "format": "landscape",
  "limit60": true
}
```

- `format`: `"landscape"` (16:9), `"vertical"` (9:16), `"square"` (1:1)
- `limit60`: when `true`, enforces MAX_CLIP_SECONDS cap

**Success response:** `200 OK` with `Content-Type: video/mp4`

**Error responses:**

| Status | Meaning |
|---|---|
| 400 | Validation error (bad URL, time format, etc.) |
| 413 | Duration exceeds maximum |
| 504 | FFmpeg timed out |
| 500 | Unexpected error |

## Example Input URLs

These must be **direct** video URLs:

- `https://cdn.example.com/sample.mp4` — direct MP4
- `https://stream.example.com/live/index.m3u8` — HLS stream

## Limitations

- **Direct URLs only:** The app accepts direct `.mp4` and `.m3u8` URLs. It does **not** download from YouTube, Vimeo, or other platforms (Terms of Service risk).
- **No uploads:** The app processes remote URLs only. File upload is not supported.
- **No persistent storage:** Clips are temporary and deleted after download.
- **Single-server:** No distributed processing. Concurrency is limited by `MAX_CONCURRENT`.

## Security

- **SSRF protection:** URLs are validated and DNS-resolved. Private/internal IPs (10.x, 172.16-31.x, 192.168.x, 127.x, link-local) are blocked.
- **No credentials in URLs:** `user:pass@host` format is rejected.
- **Protocol enforcement:** Only `http://` and `https://` are accepted.
- **Resource limits:** FFmpeg timeout and concurrency semaphore prevent abuse.
- **Temp file cleanup:** Files are always deleted, even on errors.

## Troubleshooting

| Problem | Solution |
|---|---|
| "FFmpeg timed out" | The source is too slow or the clip is too long. Try a shorter duration. |
| "Could not resolve hostname" | The URL's domain doesn't resolve. Check the URL. |
| "URL resolves to a private IP" | SSRF protection blocked an internal address. Use a public URL. |
| FFmpeg codec errors | The source may not be a valid MP4/HLS. Verify the URL plays in a browser. |
| Docker build fails | Ensure Docker and Docker Compose are installed and up to date. |

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **FFmpeg** (via Node.js `child_process`)
- **Docker Compose**
