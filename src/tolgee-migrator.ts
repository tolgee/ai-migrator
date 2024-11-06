#!/usr/bin/env node

import { Command } from "commander";
import { findFiles } from "./findFiles";
import { sendFileToChatGPT } from "./chatGPT";
import { uploadKeysToTolgee } from "./uploadKeysToTolgee";
import logger, { setLogLevel } from "./utils/logger";
import fsExtra from "fs-extra";
import path from "path";
const cliProgress = require("cli-progress");

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic,
);

// Define the directory to ignore
const TOLGEE_DIR = ".tolgee-migrator";

const { promises: fs } = fsExtra;
import {
  checkMigrationStatus,
  loadMigrationStatus,
  updateMigrationStatus,
} from "./migrationStatus";
import { saveKeys } from "./saveAllKeys";
import { execSync } from "child_process";
import { ProviderOptions } from "./responseProviders/getResponseProvider";

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

// Function to check and add .tolgee-migrator to .gitignore
function ensureDirIgnoredInGitignore() {
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  if (fsExtra.existsSync(gitignorePath)) {
    const gitignoreContent = fsExtra.readFileSync(gitignorePath, "utf8");
    if (!gitignoreContent.includes(TOLGEE_DIR)) {
      fsExtra.appendFileSync(gitignorePath, `\n${TOLGEE_DIR}\n`);
      logger.info(`Added ${TOLGEE_DIR} to .gitignore`);
    }
  } else {
    fsExtra.writeFileSync(gitignorePath, `${TOLGEE_DIR}\n`);
    logger.info(`Created .gitignore and added ${TOLGEE_DIR}`);
  }
}

// Function to check if the Git working directory is clean
function checkGitClean(): boolean {
  const result = execSync("git status --porcelain").toString().trim();
  if (result) {
    logger.error(
      "Migrator requires a clean git state. Please commit or stash changes before proceeding.",
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
  options: ProviderOptions,
  appendixPath?: string,
) => {
  try {
    const status = await loadMigrationStatus();

    // Skip already processed files
    if (status[file] && status[file].migrated) {
      logger.info(`Skipping already processed file: ${file}`);
      return;
    }

    // Send the file content to ChatGPT for localization
    const { success, result } = await sendFileToChatGPT(
      file,
      options,
      appendixPath,
    );
    if (!success) {
      logger.error(`Migration failed for file: ${file}`);

      // Update migration status to indicate failure
      await updateMigrationStatus(file, [], success); // Pass false to mark as not migrated
      return; // Exit without saving file or updating migration status
    }

    const { updatedContent, createdKeys } = result;

    // Overwrite the original file
    await fs.writeFile(file, updatedContent, "utf8");
    logger.info(`File ${file} has been updated successfully.`);

    // Get the relevant key names
    const relevantKeys = createdKeys.map((key) => key.keyName);

    // Add created keys to the list for uploading to Tolgee
    allKeys.push(...createdKeys);

    // Mark the file as processed and include relevant keys
    await updateMigrationStatus(file, relevantKeys, success);

    // Save keys to file
    await saveKeys(file, allKeys);

    logger.info(`Successfully processed and updated file: ${file}`);
  } catch (error) {
    logger.error(`Error processing file ${file}:`, error);
  }
};

// Main function to handle file migration interactively
const migrateFiles = async (
  filePattern: string,
  confirmUpload: boolean,
  options: ProviderOptions,
  appendixPath?: string,
) => {
  try {
    ensureDirIgnoredInGitignore();

    // // Check if the Git working directory is clean
    // if (!checkGitClean()) {
    //   return;
    // }

    // Load migration status
    const status = await loadMigrationStatus();

    // Find the files to process
    const files = await findFiles(filePattern);

    if (!files || files.length === 0) {
      logger.info("No files found for the given pattern.");
      return;
    }

    progressBar.start(files.length, 0);

    logger.info(`Starting migration for ${files.length} files...`);

    const allKeys: KeyObject[] = [];

    // Process each file sequentially
    for (const file of files) {
      if (logger.level === "verbose")
        logger.verbose(`Processing file: ${file}`);

      await processFile(file, status, allKeys, options, appendixPath);

      progressBar.increment();
    }
    progressBar.stop();

    // Upload the keys to Tolgee if there are any
    if (confirmUpload && allKeys.length > 0) {
      try {
        await uploadKeysToTolgee(allKeys);
        logger.info("Keys uploaded successfully to Tolgee.");
      } catch (error) {
        logger.error(`Error uploading keys to Tolgee: ${error}`);
      }
    } else {
      logger.info("Keys upload skipped.");
    }
  } catch (error) {
    logger.error(`Error during localization process: ${error}`);
  }
};
// Setup Commander CLI
const program = new Command();

program.name("tolgee-migrator").usage("[command] [options]");

program.option(
    "-l, --log-level <level>",
    "Set the logging level (error, warn, info, verbose, debug)",
    "info", // default to 'info' if not provided
)

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
  .option("--azure-api-key <azureApiKey>", "Azure OpenAI API key")
  .option("--azure-endpoint <azureEndpoint>", "Azure OpenAI endpoint")
  .option("--openai-api-key <openAiApiKey>", "OpenAI API key")
  .action(async (options) => {
    const {
      pattern,
      upload,
      appendixPath,
      azureApiKey,
      azureEndpoint,
      openAiApiKey,
    } = options;

    const { logLevel } = program.opts();
    setLogLevel(logLevel);

    try {
      // Run the migration process
      await migrateFiles(
        pattern,
        upload,
        {
          azureApiKey,
          azureEndpoint,
          openAiApiKey,
        },
        appendixPath,
      );
    } catch (error) {
      logger.error("Error during migration:", error);
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
      logger.error("Error checking migration status:", error);
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
        logger.info("Keys uploaded successfully to Tolgee..");
      } else {
        logger.info("Upload to Tolgee failed:", result.message);
      }
    } catch (error) {
      logger.error("Error uploading keys to Tolgee:", error);
    }
  });

program.parse(process.argv); // Parse the command-line arguments
