import { NextRequest } from "next/server";
import { createReadStream, statSync } from "node:fs";
import { validateUrl } from "@/lib/validateUrl";
import { computeDuration } from "@/lib/time";
import { clipSemaphore } from "@/lib/semaphore";
import { runFfmpeg, type ClipFormat } from "@/lib/ffmpeg";
import { safeUnlink } from "@/lib/cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CLIP_SECONDS = parseInt(process.env.MAX_CLIP_SECONDS || "60", 10);
const VALID_FORMATS: ClipFormat[] = ["landscape", "vertical", "square"];

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { url, start, end, format, limit60 } = body as {
    url: unknown;
    start: unknown;
    end: unknown;
    format: unknown;
    limit60: unknown;
  };

  // --- Validate inputs ---

  if (typeof url !== "string" || !url.trim()) {
    return jsonError("url is required and must be a string", 400);
  }
  if (typeof start !== "string") {
    return jsonError("start is required (HH:MM:SS)", 400);
  }
  if (typeof end !== "string") {
    return jsonError("end is required (HH:MM:SS)", 400);
  }
  if (typeof format !== "string" || !VALID_FORMATS.includes(format as ClipFormat)) {
    return jsonError(
      `format must be one of: ${VALID_FORMATS.join(", ")}`,
      400
    );
  }

  // Validate and sanitize URL (SSRF protection)
  let safeUrl: string;
  try {
    safeUrl = await validateUrl(url);
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Invalid URL",
      400
    );
  }

  // Validate times and compute duration
  const shouldLimit = limit60 !== false; // default true
  const maxSec = shouldLimit ? MAX_CLIP_SECONDS : null;
  let duration: number;
  try {
    duration = computeDuration(start, end, maxSec);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid time range";
    // If duration exceeds max, return 413
    if (msg.includes("exceeds maximum")) {
      return jsonError(msg, 413);
    }
    return jsonError(msg, 400);
  }

  // Hard cap regardless of limit60 checkbox
  if (duration > MAX_CLIP_SECONDS) {
    return jsonError(
      `Clip duration (${duration}s) exceeds hard cap of ${MAX_CLIP_SECONDS}s`,
      413
    );
  }

  // --- Acquire semaphore ---
  await clipSemaphore.acquire();
  let outputPath: string | null = null;

  try {
    const result = await runFfmpeg({
      url: safeUrl,
      start,
      duration,
      format: format as ClipFormat,
    });
    outputPath = result.outputPath;

    // Stream the file back
    const stat = statSync(outputPath);
    const nodeStream = createReadStream(outputPath);

    // Convert Node readable stream to Web ReadableStream.
    // Cleanup is tied to stream lifecycle so the file is not deleted
    // before the client finishes downloading.
    const filePath = outputPath;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: string | Buffer) => {
          const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          controller.enqueue(new Uint8Array(buf));
        });
        nodeStream.on("end", () => {
          controller.close();
          safeUnlink(filePath);
        });
        nodeStream.on("error", (err) => {
          controller.error(err);
          safeUnlink(filePath);
        });
      },
      cancel() {
        nodeStream.destroy();
        safeUnlink(filePath);
      },
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="quickclip.mp4"',
        "Content-Length": String(stat.size),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("timed out")) {
      return jsonError("FFmpeg processing timed out", 504);
    }
    return jsonError(`Processing failed: ${msg}`, 500);
  } finally {
    clipSemaphore.release();
    // Note: temp file cleanup is handled by stream event handlers above.
    // If FFmpeg failed (outputPath is null) there is nothing to clean up.
  }
}
