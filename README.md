# AI Migration Tool

This tool automates the process of migrating string literals in TypeScript and TSX files to localized keys using ChatGPT, compatible with both Azure OpenAI and OpenAI setups, and Tolgee. It tracks the migration status of each file, preventing duplicate processing, and uploads
localization keys to Tolgee for translation management.

### Features

- **File Discovery:** Finds `.tsx` files in your project directory based on a specified pattern.
- **ChatGPT Localization:** Uses ChatGPT, compatible with both Azure OpenAI and OpenAI setups, to replace string literals in React components with Tolgee's `<T>`
  component or `useTranslate` hook.
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
    - [File Finder](#1-file-finder-findfilests)
    - [Migration Status](#2-migration-status-migrationStatusts)
    - [ChatGPT Localization](#3-chatgpt-localization-chatgptts)
    - [Tolgee Integration](#4-tolgee-integration-tolgeets)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Conclusion](#conclusion)

<hr>

### Installation

#### Option 1: Run Directly with `npx`
If you prefer not to install the tool globally, you can run it directly using `npx`:

```bash
npx tolgee-migrator migrate [options]
```

#### Option 2: Clone and Install Locally

1. **Clone the repository:**
   
   ```bash
   git clone https://github.com/tolgee/ai-migrator
   cd ai-migrator
   ```
   
2. **Install the dependencies:**

   ```bash
   npm install
   ```
   
3. **Build the project:** This project is written in TypeScript, so you need to compile it to JavaScript before running
   the
   commands:
    ```bash
    npm run build
    ```
4. **Rebuild after changes:** Whenever you make changes to the TypeScript files, you need to rebuild the project by
   running:
    ```bash
    npm run build
    ```
5. **Run the tool:** After building the project, you can use the CLI as described in the [Usage](#usage) section.

<hr>

### API Key and Endpoint Configuration

To configure the tool, provide either Azure OpenAI or OpenAI credentials through command-line arguments based on the setup you're using.

**For Azure OpenAI:**
- `--azure-api-key`: The API key for Azure OpenAI, required for interacting with the ChatGPT API.
- `--azure-endpoint`: The endpoint URL for your Azure OpenAI instance, used to send API requests to Azure OpenAI.

**For OpenAI:**
- `--openai-api-key`: The API key for OpenAI, required for accessing OpenAI’s ChatGPT API.

For example, when running a migration, pass these arguments to set the configuration:

```bash
tolgee-migrator migrate --openai-api-key <your-openai-api-key>
```

Or, if using Azure OpenAI:

```bash
tolgee-migrator migrate --azure-api-key <your-azure-api-key> --azure-endpoint <your-azure-endpoint>
```

<hr>

### Usage

#### CLI Commands

The AI Migration Tool provides a command-line interface for migrating string literals to localization keys and uploading
them to Tolgee.

**Command:** `migrate`

The `migrate` command processes `.tsx` files in the project directory, replaces
string literals with Tolgee’s `<T>` component or `useTranslate` hook, and generates an `allKeys.json` file containing the created localization keys.

**Process Overview:**

   1. The project files are overwritten with new components.
   2. An `allKeys.json` file is generated and stored in the root of the project, containing the keys for localization.
   3. Users can then manually review or modify both the project files and the `allKeys.json` file.

**Usage**

```bash
tolgee-migrator migrate [options]
```

**Options**

- `-l, --log-level <level>`: Sets the logging level. Available options are `error`, `warn`, `info`, `verbose`, and `debug`. Defaults to `info.

    - Example:

        ```bash
        tolgee-migrator --log-level debug migrate --pattern "src/test_files/**/*.tsx"
        ```


- `-p, --pattern <pattern>`: Defines the file pattern to search for files to process. The default pattern is `src/**/*.tsx`.

    - Example:

        ```bash
        tolgee-migrator migrate --pattern "src/test_files/**/*.tsx"
        ```

- `-u, --upload`: Automatically uploads the created localization keys to Tolgee. If this option is **not** provided, you can upload the keys manually in a separate step using the `upload-keys` command.

    - Example:

        ```bash
        tolgee-migrator migrate --upload
        ```

- `-a, --appendixPath <appendixPath>`: Specifies the path to a file containing custom instructions (prompt appendix) for ChatGPT. This allows you to provide additional context or guidelines for the migration process.

    - Example:

        ```bash
        tolgee-migrator migrate --appendixPath "./path/to/instructions.txt"
        ```

- `--azure-api-key <azureApiKey>`: Specifies the Azure OpenAI API key.

- `--azure-endpoint <azureEndpoint>`: Specifies the Azure OpenAI endpoint URL.

- `--openai-api-key <openAiApiKey>`: Specifies the OpenAI API key.

**Examples:**

- Run the migration with the default file pattern and review the `allKeys.json` file before uploading:

  ```bash
  tolgee-migrator migrate
  ```

- Run the migration for files in the `src/test_files/` directory and automatically upload the keys:

  ```bash
  tolgee-migrator migrate --pattern "src/test_files/**/*.tsx" --upload
  ```

- Run the migration with a custom prompt appendix for ChatGPT, using the default file pattern:

  ```bash
  tolgee-migrator migrate --appendixPath "./path/to/instructions.txt"
  ```
  
- Run the migration with a specific file pattern, automatically upload the keys, and use a custom prompt appendix:

  ```bash
  tolgee-migrator migrate --pattern "src/test_files/**/*.tsx" --upload --appendixPath "./path/to/instructions.txt"
  ```
 
<br>

**Command:** `upload-keys`

The `upload-keys` command allows you to upload the localization keys that were generated and stored in the `allKeys.json` file to the Tolgee platform. This command is run after reviewing and updating the `allKeys.json` file or project files as needed.

**Process Overview:**

   1. Users **review and modify** the `allKeys.json` file and project files.
   2. Once ready, run the upload-keys` command to upload the finalized localization strings to the Tolgee platform.

**Usage**

```bash
tolgee-migrator upload-keys
```

**Examples:**

- Upload keys from `allKeys.json` to Tolgee after reviewing and finalizing them:

  ```bash
  tolgee-migrator upload-keys
  ```

<br>

**Command:** `status`

The `status` command allows you to check the migration status of a specific file or view the entire migration status.

**Usage**

```bash
tolgee-migrator status [file] [options]
```

**Options**

- `[file]`: Specify a file path to check the migration status for that particular file.

    - Example:

        ```bash
        tolgee-migrator status src/test_files/App.tsx
        ```

- `--all`: Show the entire migration status for all processed files.

    - Example:

        ```bash
        tolgee-migrator status --all
        ```

**Examples:**

- Check the migration status for a specific file:

  ```bash
  tolgee-migrator status src/test_files/App.tsx
  ```

- Show the entire migration status:

  ```bash
  tolgee-migrator status --all
  ```

<hr>

**Verbose Logging with Log Levels**

The `tolgee-migrator` CLI supports multiple logging levels to control output verbosity.

- **Default Level (info)**: Displays important messages and errors only. Shows a progress bar indicating the number of files processed.
- **Verbose**: Displays additional information about each file currently being handled.
- **Debug**: Logs detailed information including full prompts and responses from ChatGPT for each file.

To set the log level, use the `-l` or `--log-level` option:

```bash
tolgee-migrator migrate --log-level debug
```

The available log levels are:

- `error`: Only error messages.
- `warn`: Warning and error messages.
- `info`: Important messages, errors, and progress updates (default).
- `verbose`: Information about each file being processed.
- `debug`: Full output, including prompts and responses.
    
<hr>

**Running the CLI**

You can run the CLI directly using npx without global installation:

```bash
npx tolgee-migrator migrate
```

Or, for a more convenient setup, you can link the package globally using:

```bash
npm link
```

After linking, you can run the CLI globally:

```bash
tolgee-migrator migrate
```

<hr>

### Complete Workflow Example

   1. **Step 1:** Run the migration to process the files, generate `allKeys.json`, and set the log level to `debug` to see all output.
    
        ```bash
        tolgee-migrator migrate --pattern "src/test_files/**/*.tsx" --log-level debug --openai-api-key <your-openai-api-key>
        ```

   2. **Step 2:** Open the project files and `allKeys.json`, review and make any necessary updates or changes.

   3. **Step 3:** Once satisfied with the changes, upload the keys to the Tolgee platform:

        ```bash
        tolgee-migrator upload-keys
        ```

<hr>

### Modules

### 1. File Finder (`findFiles.ts`)

This module uses `fast-glob` to find all files in the project directory based on a provided pattern. It
returns a list of file paths that match the pattern.

#### Example Usage:

```ts
import {findFiles} from './findFiles';

const files = await findFiles('src/**/*.tsx');
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

This module communicates with ChatGPT, using either Azure OpenAI or OpenAI setup, to process `.tsx` file contents, primarily for React components. It sends the content of `.tsx` files
to ChatGPT, requesting that string literals be replaced with the Tolgee `<T>` component or `useTranslate` hook. The
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

The `extractCreatedKeys` function parses the response from ChatGPT, using either Azure OpenAI or OpenAI setup, to extract localization keys,
descriptions, and translations. This allows for more robust handling of the response structure and ensures that the
correct format is returned. The key names, descriptions, and default values are returned as part of the final
localization setup.

<hr>

### 4. Tolgee Integration (`uploadKeysToTolgee.ts`)

This module is responsible for uploading the keys from the `allKeys.json` file to the Tolgee platform. You can run this step manually after the migration process to ensure that all keys are finalized before uploading.

#### Example Usage:

```ts
import { uploadKeysToTolgee } from './uploadKeysToTolgee';

const keys = [
    {
        keyName: 'menu.item.translation',
        description: 'Menu item translation',
        translations: { en: 'Translation' },
    },
];

const result = await uploadKeysToTolgee(keys);
if (result.success) {
    console.log(result.message); // Logs: Keys uploaded successfully
} else {
    console.error(result.message); // Logs error message if upload fails
}
```

<hr>

### Testing

This project includes unit tests to ensure the functionality of each module, such as file discovery, migration status tracking, and Tolgee API integration. We use [Jest](https://jestjs.io/) as the testing framework.

#### Running Tests

To run all tests, use the following command:

```bash
npm test
```

You can also run specific test files:
```
npm test tests/migrationStatus.test.ts
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

This tool automates the migration of string literals in TypeScript/TSX files to localized keys using ChatGPT, through either Azure OpenAI or OpenAI setup, and Tolgee. It is designed for ease of use, tracking migration status to prevent duplicate processing, and integration
with the Tolgee platform for seamless localization management.
