import { spawn } from "node:child_process";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export type ClipFormat = "landscape" | "vertical" | "square";

const FFMPEG_TIMEOUT_SECONDS = parseInt(
  process.env.FFMPEG_TIMEOUT_SECONDS || "120",
  10
);
const TMP_DIR = process.env.TMP_DIR || "/tmp";

function buildVideoFilter(format: ClipFormat): string {
  switch (format) {
    case "landscape":
      // Scale down to max width 1280, preserve aspect ratio
      return "scale='min(1280,iw)':-2";
    case "vertical":
      // 720x1280: scale so height >= 1280, then center-crop
      return "scale=-2:1280,crop=720:1280";
    case "square":
      // 720x720: scale so smaller dimension >= 720, then center-crop
      return "scale=720:-2,crop=720:720";
  }
}

export interface ClipOptions {
  url: string;
  start: string; // HH:MM:SS
  duration: number; // seconds
  format: ClipFormat;
}

export interface ClipResult {
  outputPath: string;
}

/**
 * Run FFmpeg to cut and optionally crop/scale a clip.
 * Returns the path to the output MP4 file.
 */
export function runFfmpeg(options: ClipOptions): Promise<ClipResult> {
  const { url, start, duration, format } = options;
  const outputPath = join(TMP_DIR, `quickclip-${randomUUID()}.mp4`);
  const vf = buildVideoFilter(format);

  const args = [
    "-hide_banner",
    "-y",
    "-ss",
    start,
    "-i",
    url,
    "-t",
    String(duration),
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath,
  ];

  return new Promise<ClipResult>((resolve, reject) => {
    const proc = spawn("ffmpeg", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("FFmpeg timed out"));
    }, FFMPEG_TIMEOUT_SECONDS * 1000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ outputPath });
      } else {
        // Extract a short error message from FFmpeg's stderr
        const lines = stderr.trim().split("\n");
        const lastLines = lines.slice(-3).join(" ");
        reject(
          new Error(`FFmpeg exited with code ${code}: ${lastLines.slice(0, 300)}`)
        );
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });
  });
}
