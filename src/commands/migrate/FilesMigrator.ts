// Main function to handle file migration interactively
import {
  FileStatus,
  loadMigrationStatus,
  updateMigrationStatus,
} from "../../migrationStatus";
import { findFiles } from "../../findFiles";
import { checkGitClean } from "../../common/checkGitClean";
import logger from "../../utils/logger";
import { PresetType } from "../../presets/PresetType";
import { FileProcessor, ProcessFileReturnType } from "../../FileProcessor";

interface FilesMigratorProps {
  filePattern: string;
  preset: PresetType;
  appendixPath?: string;
  chunkSize: number;
}

export function FilesMigrator({
  filePattern,
  preset,
  appendixPath,
  chunkSize,
}: FilesMigratorProps) {
  const fileProcessor = FileProcessor(preset);

  const migrateFiles = async () => {
    // Check if the Git working directory is clean
    if (!checkGitClean()) {
      return;
    }

    // Find the files to process
    const files = await findFiles(filePattern);

    if (!files || files.length === 0) {
      logger.info("[cli][migrateFiles] No files found for the given pattern.");
      return;
    }

    logger.info(
      `[cli][migrateFiles] Found ${files.length} files. Starting migration...`,
    );

    async function processChunk(chunk: string[]) {
      const status = await loadMigrationStatus();
      const all = await Promise.all(
        chunk.map((file) => {
          // Skip already processed files
          if (status[file] && status[file].migrated) {
            logger.info(
              `[cli][processFile] Skipping already processed file: ${file}`,
            );
            return null;
          }

          return fileProcessor
            .processFile(file, appendixPath)
            .then((result) => ({
              result: result as ProcessFileReturnType,
              filePath: file,
              error: undefined,
            }))
            .catch((e) => ({
              filePath: file,
              error: e,
              result: undefined as ProcessFileReturnType | undefined,
            }));
        }),
      );
      const fileStatuses: FileStatus[] = all.map((result) => {
        if (!result) {
          throw Error("No result from processFile");
        }

        if (!result.error) {
          if (!result.result) {
            throw Error("No error and no result from processFile");
          }
          return {
            filePath: result.filePath,
            keys: result.result.keys,
            success: true,
          };
        }

        return {
          filePath: result.filePath,
          keys: [] as any,
          success: false,
        };
      });
      await updateMigrationStatus({ currentStatus: status, fileStatuses });
    }

    await forEachChunk(files, chunkSize, async (chunk) => {
      await processChunk(chunk);
    });
  };

  return {
    migrateFiles,
  };
}

async function forEachChunk<T>(
  arr: T[],
  chunkSize: number,
  callback: (chunk: T[]) => Promise<void>,
) {
  for (let i = 0; i < arr.length; i += chunkSize) {
    await callback(arr.slice(i, i + chunkSize));
  }
}
