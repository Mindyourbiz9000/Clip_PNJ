const TIME_RE = /^(\d{2}):(\d{2}):(\d{2})$/;

/**
 * Parse HH:MM:SS string into total seconds.
 * Throws on invalid format.
 */
export function parseTime(value: string): number {
  const match = value.match(TIME_RE);
  if (!match) {
    throw new Error(`Invalid time format: "${value}". Expected HH:MM:SS`);
  }
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = parseInt(match[3], 10);
  if (m > 59 || s > 59) {
    throw new Error(`Invalid time value: "${value}". Minutes and seconds must be 0-59`);
  }
  return h * 3600 + m * 60 + s;
}

/**
 * Compute duration in seconds between start and end.
 * Validates that end > start and optionally caps at maxSeconds.
 */
export function computeDuration(
  startStr: string,
  endStr: string,
  maxSeconds: number | null
): number {
  const startSec = parseTime(startStr);
  const endSec = parseTime(endStr);
  const duration = endSec - startSec;

  if (duration <= 0) {
    throw new Error("End time must be after start time");
  }

  if (maxSeconds !== null && duration > maxSeconds) {
    throw new Error(
      `Clip duration (${duration}s) exceeds maximum allowed (${maxSeconds}s)`
    );
  }

  return duration;
}
