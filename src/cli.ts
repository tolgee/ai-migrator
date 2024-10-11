#!/usr/bin/env node

import {Command} from 'commander';
import {findFiles} from './findFiles';
import {sendFileToChatGPT} from './chatGPT';
import {uploadKeysToTolgee} from './uploadKeysToTolgee';
import fsExtra from 'fs-extra';

const {promises: fs} = fsExtra;
import {checkMigrationStatus, loadMigrationStatus, updateMigrationStatus} from "./migrationStatus";
import * as path from "node:path";

type KeyObject = {
    keyName: string;
    description: string;
    translations: { en: string }
};

// Function to process a single file
const processFile = async (file: string, status: any, allKeys: KeyObject[]) => {
    try {
        const status = await loadMigrationStatus();

        // Skip already processed files
        if (status[file] && status[file].migrated) {
            console.log(`Skipping already processed file: ${file}`);
            return;
        }

        // Send the file content to ChatGPT for localization
        const result = await sendFileToChatGPT(file);
        if (!result) {
            console.error('No result returned from ChatGPT');
        }

        const {updatedContent, createdKeys} = result;

        // Ensure the directory exists
        const migratedDir = 'src/migrated_files';
        await fsExtra.ensureDir(migratedDir);

        // Extract the file name from the full path
        const fileName = path.basename(file);

        // Write the updated content back to the file (in migrated_files directory)
        await fs.writeFile(path.join(migratedDir, fileName), updatedContent, 'utf8');

        // Get the relevant key names
        const relevantKeys = createdKeys.map(key => key.keyName);

        // Add created keys to the list for uploading to Tolgee
        allKeys.push(...createdKeys);

        // Mark the file as processed and include relevant keys
        await updateMigrationStatus(file, relevantKeys);

        console.log(`Successfully processed and updated file: ${file}`);
    } catch (error) {
        console.error(`Error processing file ${file}:`, error);
    }
};

// Main function to handle file migration interactively
const migrateFiles = async (filePattern: string, confirmUpload: boolean) => {
        try {
            // Load migration status
            let status = await loadMigrationStatus();

            // Find the files to process
            let files = await findFiles(filePattern);

            if (!files || files.length === 0) {
                console.log('No files found for the given pattern.');
                return;
            }

            console.log(`Found ${files.length} files. Starting migration...`);

            let allKeys: KeyObject[] = [];

            // Process each file asynchronously
            await Promise.all(files.map(file => processFile(file, status, allKeys)));

            // Upload the keys to Tolgee if there are any
            if (confirmUpload && allKeys.length > 0) {
                try {
                    await uploadKeysToTolgee(allKeys);
                    console.log('Keys uploaded successfully to Tolgee.');
                } catch (error) {
                    console.error(`Error uploading keys to Tolgee: ${error}`);
                }
            } else {
                console.log('Keys upload skipped.');
            }
        } catch (error) {
            console.error(`Error during localization process: ${error}`);
        }
    }
;

// Setup Commander CLI
const program = new Command();

program
    .name('cli')
    .usage('[command] [options]')

// Migrate command
program
    .command('migrate')
    .description('Migrate files and upload keys to Tolgee')
    .option('-p, --pattern <pattern>', 'File pattern to search for (e.g., src/**/*.tsx)', 'src/**/*.tsx')
    .option('-u, --upload', 'Automatically upload created keys to Tolgee', false)
    .option('-s, --status <file>', 'Check migration status of a specific file')
    .action(async (options) => {
        const {pattern, upload} = options;
        try {
            // Otherwise, run the migration process
            await migrateFiles(pattern, upload);
        } catch (error) {
            console.error('Error during migration:', error);
        }
    });

// Status command
program
    .command('status [file]')
    .description('Check the migration status of a specific file or show the entire status with --all')
    .option('--all', 'Show the entire migration status')
    .action(async (file, options) => {
        const {all} = options;
        try {
            await checkMigrationStatus(file, all);
        } catch (error) {
            console.error('Error checking migration status:', error);
        }
    });

program
    .parse(process.argv); // Parse the command-line arguments