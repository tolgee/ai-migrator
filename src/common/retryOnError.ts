import logger from "../utils/logger";
import {sleep} from "./sleep";

interface RetryOnErrorParams<T> {
  retries: number;
  callback: () => Promise<T>;
  errorMatcher?: (error: any) => boolean;
}

export async function retryOnError<T>({
  retries,
  callback,
  errorMatcher,
}: RetryOnErrorParams<T>): Promise<T> {
  let attempts = 0;
  let lastError: any;
  while (attempts < retries) {
    try {
      return await callback();
    } catch (error) {
      if (errorMatcher && !errorMatcher(error)) {
        throw error;
      }
      attempts++;
      if (attempts >= retries) {
        lastError = error;
        break;
      }
    }
  }

  logger.error("Retry limit exceeded after " + attempts + " attempts...");
  throw lastError!;
}

interface RetryOnRateLimitParams<T> {
  retryAfterProvider: (e: any) => number | undefined;
  callback: () => Promise<T>;
}

/**
 * Retry a callback when a rate limit is exceeded
 * @param retryAfterProvider If provider returns a positive number, the callback will be retried after that many milliseconds
 * @param callback
 */
export async function retryOnRateLimit<T>({
  retryAfterProvider,
  callback,
}: RetryOnRateLimitParams<T>): Promise<T> {
  while (true) {
    try {
      return await callback();
    } catch (error) {
      const retryAfter = retryAfterProvider(error as Error);
      if (retryAfter && retryAfter > 0) {
        logger.info(
          `Rate limit exceeded. Retrying after ${Math.round(retryAfter / 1000)} seconds...`,
        );
        await sleep(retryAfter);
        continue;
      }
      throw error;
    }
  }
}
