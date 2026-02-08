export const RETRY_LIMIT = 3;

export function calcNextRetryAt(retryCount: number) {
  const delaysSec = [30, 120, 600];
  const sec = delaysSec[Math.min(retryCount, delaysSec.length - 1)];
  return new Date(Date.now() + sec * 1000);
}
