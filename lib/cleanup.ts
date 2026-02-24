import { unlink } from "node:fs/promises";

/**
 * Safely delete a file, ignoring errors if the file doesn't exist.
 */
export async function safeUnlink(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // file already gone or never created — ignore
  }
}
