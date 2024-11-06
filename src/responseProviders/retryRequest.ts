import { OpenAI } from "openai";

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 10,
  initialDelay: number = 1000,
  jitter: boolean = true,
): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await fn(); // Attempt the function
    } catch (error) {
      if (error instanceof OpenAI.RateLimitError) {
        attempt++;
        if (attempt >= maxRetries) throw new Error("Max retries exceeded");

        // Calculate backoff with jitter
        const backoffDelay = delay * (1 + (jitter ? Math.random() : 0));
        console.warn(
          `Rate limit hit. Retrying in ${backoffDelay / 1000} seconds...`,
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));

        // Increase delay for next retry
        delay *= 2;
      } else {
        throw error; // If it's not a rate limit error, rethrow
      }
    }
  }
  throw new Error("Failed to complete request after maximum retries");
}
