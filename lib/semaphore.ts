/**
 * Simple in-memory counting semaphore for limiting concurrency.
 */
export class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.current++;
        resolve();
      });
    });
  }

  release(): void {
    this.current--;
    const next = this.queue.shift();
    if (next) next();
  }
}

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || "1", 10);
export const clipSemaphore = new Semaphore(MAX_CONCURRENT);
