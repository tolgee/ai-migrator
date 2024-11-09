import fsExtra from "fs-extra";
import { getFilePaths } from "./FilePaths";
import logger from "./utils/logger";
import { Key } from "./responseProviders/responseFormat";
import path from "node:path";

const { promises: fs } = fsExtra;

export interface MigrationStatus {
  [filePath: string]: {
    migrated: boolean;
    keys: Key[];
  };
}

export interface FileStatus {
  filePath: string;
  keys: Key[];
  success: boolean;
}

interface UpdateMigrationStatusProps {
  fileStatuses: FileStatus[];
  currentStatus: MigrationStatus;
}

// Function to update migration status
export const updateMigrationStatus = async ({
                                              currentStatus,
                                              fileStatuses,
                                            }: UpdateMigrationStatusProps): Promise<void> => {
  const {storageDir, statusFilePath} = getFilePaths();
  await fsExtra.ensureDir(storageDir);

  fileStatuses.forEach(({ filePath, keys, success }) => {
    // Update the file status and relevant keys
    currentStatus[filePath] = {
      migrated: success,
      keys,
    };
  });

  // Write the updated status back to the JSON file
  await fs.writeFile(
    statusFilePath,
    JSON.stringify(currentStatus, null, 2),
    "utf8",
  );
};

// Function to load migration status
export const loadMigrationStatus = async (): Promise<MigrationStatus> => {
    const { statusFilePath } = getFilePaths();

    // Check if the file exists before trying to load it
    const exists = await fsExtra.pathExists(statusFilePath);
    if (!exists) {
      const dirname = path.dirname(statusFilePath)
      await fsExtra.ensureDir(dirname);
      await fsExtra.writeJson(statusFilePath, {});
    }

    // If the file exists, load it
    const fileContent = await fs.readFile(statusFilePath, "utf8");
    if (!fileContent.trim()) {
      // File is empty
      return {};
    } else {
      // File is not empty
      return JSON.parse(fileContent) as MigrationStatus;
    }
};

// Function to check the migration status of a specific file or show the entire status
export const checkMigrationStatus = async (
  filePath?: string,
  showAll?: boolean,
) => {
  try {
    const status = await loadMigrationStatus();

    if (showAll) {
      // Show the entire status file
      logger.info(
        "[migrationStatus][check] Complete migration status:",
        status,
      );
    } else if (filePath) {
      // Check status for the specific file
      const fileStatus = status[filePath];
      if (fileStatus) {
        logger.info(
          `[migrationStatus][check] Migration status for ${filePath}:`,
          fileStatus,
        );
      } else {
        logger.info(
          `[migrationStatus][check] ${filePath} has not been migrated yet.`,
        );
      }
    } else {
      logger.info(
        "[migrationStatus][check] Please provide a file to check its migration status or use the --all option to display the entire status.",
      );
    }
  } catch (error) {
    console.error(
      `[migrationStatus][check] Error checking migration status:`,
      error,
    );
  }
};
