# AI Migration Tool

This tool automates the process of migrating string literals in TypeScript and TSX files to localized keys using Azure
OpenAI's ChatGPT and Tolgee. It tracks the migration status of each file, preventing duplicate processing, and uploads
localization keys to Tolgee for translation management.

### Features

- **File Discovery:** Finds .ts and .tsx files in your project directory based on a specified pattern.
- **ChatGPT Localization:** Uses OpenAI's ChatGPT to replace string literals in React components with Tolgee's <T>
  component.
- **Migration Status Tracking:** Saves and loads the migration status from a JSON file, ensuring that files are
  processed only once.
- **Tolgee Integration:** Uploads the created localization keys to the Tolgee platform via its REST API.

<hr>

### Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
    - [CLI Commands](#cli-commands)
- [Modules](#modules)
    - [File Finder](#1-file-finder-findfilesmts)
    - [Migration Status](#2-migration-status-migrationStatusmts)
    - [ChatGPT Localization](#3-chatgpt-localization-chatgptmts)
    - [Tolgee Integration](#4-tolgee-integration-tolgeemts)
- [Error Handling](#error-handling)
- [Conclusion](#conclusion)

<hr>

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tolgee/ai-migrator
   cd ai-migrator
   ```
2. **Install the dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:** Create a `.env` file in the root of the project and add your Azure OpenAI API key,
   endpoint, and deployment details:
    ```bash
    AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
    AZURE_OPENAI_ENDPOINT=https://your-azure-endpoint-url
    AZURE_OPENAI_DEPLOYMENT=gpt-4o
    ```
4. **Build the project:** This project is written in TypeScript, so you need to compile it to JavaScript before running
   the
   commands:
    ```bash
    npm run build
    ```
5. **Rebuild after changes:** Whenever you make changes to the TypeScript files, you need to rebuild the project by
   running:
    ```bash
    npm run build
    ```
6. **Run the tool:** After building the project, you can use the CLI as described in the [Usage](#usage) section.

<hr>

### Environment Variables

- **AZURE_OPENAI_API_KEY**: The API key for OpenAI, required for interacting with the ChatGPT API.
- **AZURE_OPENAI_ENDPOINT**: The endpoint URL for your Azure OpenAI instance, used to send API requests to Azure OpenAI.
- **AZURE_OPENAI_DEPLOYMENT**: The name of the OpenAI model deployment in Azure, used to specify which model (e.g.,
  gpt-4o) is being used.

<hr>

### Usage

#### CLI Commands

The AI Migration Tool provides a command-line interface for migrating string literals to localization keys and uploading
them to Tolgee.

**Command:** `migrate`

The `migrate` command processes all specified files (e.g., `.ts`, `.tsx`, etc.) in the project directory, replaces
string literals with Tolgee’s `<T> component, and uploads the keys to Tolgee.

**Usage**

```bash
cli migrate [options]
```

**Options**

- `-p, --pattern <pattern>`: Defines the file pattern to search for files to process. The default pattern is src/**/*
  .tsx`.

    - Example:

        ```bash
        cli migrate --pattern "src/test_files/**/*.tsx"
        ```

- `-u, --upload`: Automatically uploads the created localization keys to Tolgee. If not provided, the CLI will prompt
  for
  confirmation before uploading.

    - Example:

        ```bash
        cli migrate --upload
        ```

**Examples:**

- Run the migration with the default file pattern and prompt before uploading:

  ```bash
  cli migrate
  ```

- Run the migration for files in the `src/test_files/` directory and automatically upload the keys:

  ```bash
  cli migrate --pattern "src/test_files/**/*.tsx" --upload
  ```

<br>

**Command:** `status`

The `status` command allows you to check the migration status of a specific file or view the entire migration status.

**Usage**

```bash
cli status [file] [options]
```

**Options**

- `[file]`: Specify a file path to check the migration status for that particular file.

    - Example:

        ```bash
        cli status src/test_files/App.tsx
        ```

- `--all`: Show the entire migration status for all processed files.

    - Example:

        ```bash
        cli status --all
        ```

**Examples:**

- Check the migration status for a specific file:

  ```bash
  cli status src/test_files/App.tsx
  ```

- Show the entire migration status:

  ```bash
  cli status --all
  ```

<hr>

**Running the CLI**

You can run the CLI directly using npx without global installation:

```bash
npx ts-node --esm src/cli.ts migrate
```

Or, for a more convenient setup, you can link the package globally using:

```bash
npm link
```

After linking, you can run the CLI globally:

```bash
cli migrate
```

<hr>

### Modules

### 1. File Finder (`findFiles.ts`)

This module uses `fast-glob` to find all files in the project directory based on a provided pattern. It
returns a list of file paths that match the pattern.

#### Example Usage:

```ts
import {findFiles} from './findFiles';

const files = await findFiles('src/**/*.{ts,tsx}');
console.log('Files found:', files);
```

### 2. Migration Status (`migrationStatus.ts`)

This module manages the migration status, saving, loading, and checking it from a JSON file (migration-status.json). The
status is used to track which files have already been processed, ensuring that each file is processed only once.

- **updateMigrationStatus:** Saves the current migration status to a JSON file.
- **loadMigrationStatus:** Loads the migration status from the JSON file, creating the file if it doesn't exist.
- **checkMigrationStatus:** Checks the migration status of a specific file or displays the entire migration status if
  requested.

#### Example Usage:

```ts
import {loadMigrationStatus, updateMigrationStatus, checkMigrationStatus} from './migrationStatus';

// Load the migration status
const status = await loadMigrationStatus();
console.log('Migration Status:', status);

// After processing a file, update the status
await updateMigrationStatus('src/test_files/App.tsx', ['keyName1', 'keyName2']);

// Check the status of a specific file
await checkMigrationStatus('src/test_files/App.tsx');

// Show the entire status
await checkMigrationStatus("", true);
```

### 3. ChatGPT Localization (`chatGPT.ts`)

This module communicates with Azure OpenAI (ChatGPT) to process file contents. It sends the content of various file
types (e.g., .ts, .tsx, etc.) to ChatGPT, requesting that string literals be replaced with the Tolgee <T> component. The
function returns the updated file content and the list of created localization keys.

#### Example Usage:

```ts
import {sendFileToChatGPT} from './chatGPT';

const result = await sendFileToChatGPT('src/test_files/App.tsx');
const {updatedContent, createdKeys} = result;

console.log('Updated Content:', updatedContent);
console.log('Created Keys:', createdKeys);
```

#### Extracting Keys

The `extractCreatedKeys` function parses the response from Azure OpenAI (ChatGPT) to extract localization keys,
descriptions, and translations. This allows for more robust handling of the response structure and ensures that the
correct format is returned. The key names, descriptions, and default values are returned as part of the final
localization setup.

<hr>

### 4. Tolgee Integration (`uploadKeysToTolgee.ts`)

This module uploads the localization keys to Tolgee via their REST API. It takes an array of keys and uploads them in
the required format. Any errors during the upload process are caught and logged.

#### Example Usage:

```ts
import {uploadKeysToTolgee} from './tolgee';

const keys = [
    {keyName: 'menu.item.translation', defaultValue: 'Translation'},
];

await uploadKeysToTolgee(keys);
console.log('Keys uploaded successfully to Tolgee.');
```

<hr>

### Error Handling

Each module includes error handling for improved reliability:

- **File Finder:** Catches errors while reading the file system and throws meaningful messages.
- **Migration Status:** Logs errors if the migration status file cannot be read or written to.
- **ChatGPT Localization:** Throws errors when there is a failure during the ChatGPT API call.
- **Tolgee Integration:** Handles and logs errors that occur during the key upload process.
- **CLI Feedback:** The CLI informs the user about any files that fail to process or upload. Error messages will be
  displayed directly in the CLI output, including details about which step failed (e.g., file reading, localization, key
  upload).

### Conclusion

This tool automates the migration of string literals in TypeScript/TSX files to localized keys using Azure OpenAI's
ChatGPT
and Tolgee. It is designed for ease of use, tracking migration status to prevent duplicate processing, and integration
with the Tolgee platform for seamless localization management.
