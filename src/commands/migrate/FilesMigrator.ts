import {
  loadMigrationStatus,
  updateMigrationStatus,
} from '../../migrationStatus';
import { findFiles } from '../../findFiles';
import { checkGitClean } from '../../common/checkGitClean';
import logger from '../../utils/logger';
import { PresetType } from '../../presets/PresetType';
import { FileProcessor } from '../../FileProcessor';
import { AiProviderOptions } from '../../responseProviders/createResponseProvider';

interface FilesMigratorProps {
  filePattern: string;
  preset: PresetType;
  appendixPath?: string;
  concurrency: number;
  providerOptions: AiProviderOptions;
}

export function FilesMigrator({
  filePattern,
  preset,
  appendixPath,
  concurrency,
  providerOptions,
}: FilesMigratorProps) {
  const fileProcessor = FileProcessor(preset, providerOptions);

  const migrateFiles = async () => {
    checkGitClean();

    const files = await findFiles(filePattern);

    if (!files || files.length === 0) {
      logger.info('[cli][migrateFiles] No files found for the given pattern.');
      return;
    }

    logger.info(
      `[cli][migrateFiles] Found ${files.length} files. Starting migration...`
    );

    const fileQueue = [...files];
    const activePromises: Promise<void>[] = [];
    let processed = 0;

    const status = await loadMigrationStatus();

    const processFile = async (file: string) => {
      if (status[file] && status[file].migrated) {
        logger.info(
          `[cli][processFile] Skipping already processed file: ${file}`
        );
        return;
      }

      try {
        logger.info(`[FileProcessor] Processing file: ${file}`);
        const result = await fileProcessor.processFile(file, appendixPath);
        logger.info(
          `[FileProcessor] Processed file: ${file} ✅ ${++processed}/${files.length}`
        );
        await updateMigrationStatus({
          currentStatus: status,
          fileStatuses: [{ filePath: file, keys: result.keys, success: true }],
        });
      } catch (error) {
        logger.error(
          `[cli][processFile] Error processing file: ${file}`,
          error
        );
        await updateMigrationStatus({
          currentStatus: status,
          fileStatuses: [{ filePath: file, keys: [], success: false }],
        });
      }
    };

    const processQueue = async () => {
      while (fileQueue.length > 0) {
        if (activePromises.length < concurrency) {
          const file = fileQueue.shift();
          if (file) {
            const promise = processFile(file).then(() => {
              activePromises.splice(activePromises.indexOf(promise), 1);
            });
            activePromises.push(promise);
          }
        } else {
          await Promise.race(activePromises);
        }
      }
      await Promise.all(activePromises);
    };

    await processQueue();
    logger.info('[cli][migrateFiles] Migration completed.');
  };

  return {
    migrateFiles,
  };
}
