// Main function to handle file migration interactively
import {loadMigrationStatus, updateMigrationStatus} from "../../migrationStatus";
import {findFiles} from "../../findFiles";
import {saveKeys} from "../../saveAllKeys";
import {checkGitClean} from "../../common/checkGitClean";
import {sendFileToChatGPT} from "../../chatGPT";
import fsExtra from "fs-extra";

const { promises: fs } = fsExtra;

export const migrateFiles = async (
  filePattern: string,
  confirmUpload: boolean,
  appendixPath?: string,
) => {
  try {
    // Check if the Git working directory is clean
    if (!checkGitClean()) {
      return;
    }

    // Find the files to process
    const files = await findFiles(filePattern);

    if (!files || files.length === 0) {
      console.log("[cli][migrateFiles] No files found for the given pattern.");
      return;
    }

    console.log(
      `[cli][migrateFiles] Found ${files.length} files. Starting migration...`,
    );

    // Process each file sequentially
    //iterate over index and value
    for (let index = 0; index < files.length; index++) {
      const keysFilePath = files[index];
      console.log(
        `[cli][migrateFiles] Processing file ${index + 1}/${files.length}: ${keysFilePath}`,
      );
      const keys = await processFile(keysFilePath, appendixPath);
      await saveKeys(keysFilePath, keys);
    }
  } catch (error) {
    console.error(
      `[cli][migrateFiles] Error during localization process: ${error}`,
    );
  }
};

// Function to process a single file
const processFile = async (
  file: string,
  appendixPath?: string,
) => {
  const status = await loadMigrationStatus();

  // Skip already processed files
  if (status[file] && status[file].migrated) {
    console.log(
      `[cli][processFile] Skipping already processed file: ${file}`,
    );
    return [];
  }

  try {
    // Send the file content to ChatGPT for localization
    const result = await sendFileToChatGPT(file, appendixPath);

    const { newFileContents, keys } = result;

    if(keys.length === 0){
      console.log(
        `[cli][processFile] No keys found in file: ${file}`,
      );
      await updateMigrationStatus(file, [], false);
      return [];
    }

    // Overwrite the original file
    await fs.writeFile(file, newFileContents, "utf8");
    console.log(
      `[cli][processFile] File ${file} has been updated successfully.`,
    );

    // Get the relevant key names
    const relevantKeys = keys.map((key) => key.name);

    // Mark the file as processed and include relevant keys
    await updateMigrationStatus(file, relevantKeys, true);

    console.log(
      `[cli][processFile] Successfully processed and updated file: ${file}`,
    );

    return keys;
  } catch (e) {
    console.error(`[cli][processFile] Migration failed for file: ${file}`, e);

    // Update migration status to indicate failure
    await updateMigrationStatus(file, [], false); // Pass false to mark as not migrated
    return [];
  }
};
