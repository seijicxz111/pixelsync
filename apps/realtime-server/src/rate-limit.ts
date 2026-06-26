export class SocketRateLimiter {
  private readonly buckets = new Map<string, { tokens: number; refreshedAt: number }>();

  public constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number
  ) {}

  public consume(key: string, cost = 1): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, refreshedAt: now };
    const elapsedSeconds = (now - bucket.refreshedAt) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSeconds * this.refillPerSecond);
    bucket.refreshedAt = now;

    if (bucket.tokens < cost) {
      this.buckets.set(key, bucket);
      return false;
    }

    bucket.tokens -= cost;
    this.buckets.set(key, bucket);
    return true;
  }

  public delete(key: string): void {
    this.buckets.delete(key);
  }
}
