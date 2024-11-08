import fsExtra from "fs-extra";
import { getFilePaths } from "./FilePaths";
import logger from "./utils/logger";

const { promises: fs } = fsExtra;

interface MigrationStatus {
  [filePath: string]: {
    migrated: boolean;
    relevantKeys: string[];
  };
}

// Function to update migration status
export const updateMigrationStatus = async (
  filePath: string,
  relevantKeys: string[],
  success: boolean,
): Promise<void> => {
  try {
    const { storageDir, statusFilePath } = getFilePaths();
    await fsExtra.ensureDir(storageDir);
    const currentStatus = await loadMigrationStatus();

    // Update the file status and relevant keys
    currentStatus[filePath] = {
      migrated: success,
      relevantKeys,
    };

    // Write the updated status back to the JSON file
    await fs.writeFile(
      statusFilePath,
      JSON.stringify(currentStatus, null, 2),
      "utf8",
    );
  } catch (error) {
    console.error(
      "[migrationStatus][update] Error updating migration status:",
      error,
    );
  }
};

// Function to load migration status
export const loadMigrationStatus = async (): Promise<MigrationStatus> => {
  try {
    const { statusFilePath } = getFilePaths();

    // Check if the file exists before trying to load it
    const exists = await fsExtra.pathExists(statusFilePath);
    if (!exists) {
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
  } catch (error) {
    console.error(
      `[migrationStatus][load] Error loading migration status: ${error}`,
    );
    return {};
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
