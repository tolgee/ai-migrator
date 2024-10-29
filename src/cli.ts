#!/usr/bin/env node

import { Command } from "commander";
import { findFiles } from "./findFiles";
import { sendFileToChatGPT } from "./chatGPT";
import { uploadKeysToTolgee } from "./uploadKeysToTolgee";
import fsExtra from "fs-extra";

const { promises: fs } = fsExtra;
import {
  checkMigrationStatus,
  loadMigrationStatus,
  updateMigrationStatus,
} from "./migrationStatus";
import { saveKeys } from "./saveAllKeys";
import { execSync } from "child_process";

type KeyObject = {
  keyName: string;
  description: string;
  translations: { en: string };
};

interface MigrationStatus {
  [filePath: string]: {
    migrated: boolean;
    relevantKeys: string[];
  };
}

// Function to check if the Git working directory is clean
function checkGitClean(): boolean {
  const result = execSync("git status --porcelain").toString().trim();
  if (result) {
    console.error(
      "[cli][checkGitClean] Migrator requires a clean git state. Please commit or stash changes before proceeding.",
    );
    return false;
  }
  return true;
}

// Function to process a single file
const processFile = async (
  file: string,
  status: MigrationStatus,
  allKeys: KeyObject[],
  appendixPath?: string,
) => {
  try {
    const status = await loadMigrationStatus();

    // Skip already processed files
    if (status[file] && status[file].migrated) {
      console.log(
        `[cli][processFile] Skipping already processed file: ${file}`,
      );
      return;
    }

    // Send the file content to ChatGPT for localization
    const result = await sendFileToChatGPT(file, appendixPath);
    if (!result) {
      console.error("[cli][processFile] No result returned from ChatGPT");
    }

    const { updatedContent, createdKeys } = result;

    // Overwrite the original file
    await fs.writeFile(file, updatedContent, "utf8");
    console.log(
      `[cli][processFile] File ${file} has been updated successfully.`,
    );

    // Get the relevant key names
    const relevantKeys = createdKeys.map((key) => key.keyName);

    // Add created keys to the list for uploading to Tolgee
    allKeys.push(...createdKeys);

    // Mark the file as processed and include relevant keys
    await updateMigrationStatus(file, relevantKeys);

    // Save keys to file
    await saveKeys(file, allKeys);

    console.log(
      `[cli][processFile] Successfully processed and updated file: ${file}`,
    );
  } catch (error) {
    console.error(`[cli][processFile] Error processing file ${file}:`, error);
  }
};

// Main function to handle file migration interactively
const migrateFiles = async (
  filePattern: string,
  confirmUpload: boolean,
  appendixPath?: string,
) => {
  try {
    // Check if the Git working directory is clean
    if (!checkGitClean()) {
      return;
    }

    // Load migration status
    const status = await loadMigrationStatus();

    // Find the files to process
    const files = await findFiles(filePattern);

    if (!files || files.length === 0) {
      console.log("[cli][migrateFiles] No files found for the given pattern.");
      return;
    }

    console.log(
      `[cli][migrateFiles] Found ${files.length} files. Starting migration...`,
    );

    const allKeys: KeyObject[] = [];

    // Process each file asynchronously
    await Promise.all(
      files.map((file) => processFile(file, status, allKeys, appendixPath)),
    );

    // Upload the keys to Tolgee if there are any
    if (confirmUpload && allKeys.length > 0) {
      try {
        await uploadKeysToTolgee(allKeys);
        console.log(
          "[cli][migrateFiles] Keys uploaded successfully to Tolgee.",
        );
      } catch (error) {
        console.error(
          `[cli][migrateFiles] Error uploading keys to Tolgee: ${error}`,
        );
      }
    } else {
      console.log("[cli][migrateFiles] Keys upload skipped.");
    }
  } catch (error) {
    console.error(
      `[cli][migrateFiles] Error during localization process: ${error}`,
    );
  }
};
// Setup Commander CLI
const program = new Command();

program.name("cli").usage("[command] [options]");

// Migrate command
program
  .command("migrate")
  .description("Migrate files and upload keys to Tolgee")
  .option(
    "-p, --pattern <pattern>",
    "File pattern to search for (e.g., src/**/*.tsx)",
    "src/**/*.tsx",
  )
  .option("-u, --upload", "Automatically upload created keys to Tolgee", false)
  .option(
    "-a, --appendixPath <appendixPath>",
    "Path to file with custom prompt appendix",
  )
  .action(async (options) => {
    const { pattern, upload, appendixPath } = options;
    try {
      // Run the migration process
      await migrateFiles(pattern, upload, appendixPath);
    } catch (error) {
      console.error("[cli][migrate command] Error during migration:", error);
    }
  });

// Status command
program
  .command("status [file]")
  .description(
    "Check the migration status of a specific file or show the entire status with --all",
  )
  .option("--all", "Show the entire migration status")
  .action(async (file, options) => {
    const { all } = options;
    try {
      await checkMigrationStatus(file, all);
    } catch (error) {
      console.error(
        "[cli][status command] Error checking migration status:",
        error,
      );
    }
  });

// Upload command
program
  .command("upload-keys")
  .description("Upload the localization strings to Tolgee")
  .action(async () => {
    try {
      const keys = await fsExtra.readJson("allKeys.json");
      const result = await uploadKeysToTolgee(keys);

      if (result.success) {
        console.log(
          "[cli][upload command] Keys uploaded successfully to Tolgee..",
        );
      } else {
        console.log(
          "[cli][upload command] Upload to Tolgee failed:",
          result.message,
        );
      }
    } catch (error) {
      console.error(
        "[cli][upload command] Error uploading keys to Tolgee:",
        error,
      );
    }
  });

program.parse(process.argv); // Parse the command-line arguments
