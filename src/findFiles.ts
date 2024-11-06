import glob from "fast-glob";
import logger from "./utils/logger";

export const findFiles = async (
  pattern: string | string[],
): Promise<string[]> => {
  try {
    // Get all the files that match the patterns
    const files = await glob(pattern, { onlyFiles: true });

    if (files.length === 0) {
      logger.error(`No files matched the pattern: ${pattern}`);
      return [];
    }

    return files as string[];
  } catch (error) {
    logger.error(`Error while finding files: ${error}`);
    return [];
  }
};
