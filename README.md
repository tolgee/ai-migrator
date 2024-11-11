## Tolgee AI i18n migrator

This tool is used to migrate your app code from raw string to use Tolgee SDKs, so you can manage
your localization effectively with Tolgee.

## Motivation

Although we still recommend to prepare your project for localization from the beginning, the reality
is that many developers start with raw strings and then decide to localize their app.

This tool is here to help you with this process. It will scan your project for raw strings and
replace them with Tolgee SDK calls.

e.g. for React, it will replace:
```typescript jsx
export const WelcomeMessage = () => {
  return <div>Welcome!</div>;
};
```

with:
```typescript jsx
import { T } from '@tolgee/react';
export const WelcomeMessage = () => {
  return <div><T keyName="welcome-message" /></div>
}
```

## Prerequisites

This tool help you to migrate your project to use Tolgee SDKs by removing the repetitive task of replacing raw strings
(or other library usage) with Tolgee SDK calls.

However, you will have to do some non-repetitive manual work to finish the migration process.

- Tolgee has to be setup in your code project, follow the [docs](https://docs.tolgee.io/js-sdk) to set up Tolgee SDKs in
  your project. Steps like installing the libraries, creating Tolgee or wrapping your app code with Tolgee provider is
  not subject of this tool.
- You need to have an OpenAI API key. You can get it [here](https://platform.openai.com/api-keys). Alternatively, you
  cau use the Azure OpenAI.
- You need to have a project in Tolgee platform where you want to upload the keys. You can create a new project in
  Tolgee platform [here](https://app.tolgee.io).
- You need to create an API key for the project in Tolgee platform. To create one, follow
  these [docs](https://docs.tolgee.io/platform/account_settings/api_keys_and_pat_tokens/#generation).

## Usage

The migration process is divided into two steps. First step, `migrate` command execution, will process your files,
replacing them with migrated version and produce status file including the localization keys to create.

In the second step, you can manually fix the migrated files and status file. You can also add new keys to the status
file.

The third step, `upload-keys` command execution will upload the keys to the Tolgee platform.

### Step 1 - `migrate` command execution

1. Install the tool globally:
    ```bash
    npm install -g @tolgee/ai-migrator
    ```

2. Run the migration command:

   This will replace your original files with migrated versions and create a status file with keys to upload to Tolgee
   platform.

   The command requires clean git state, if you have any uncommitted changes, stash them or commit them, or else you
   will get `Migrator requires a clean git state. Please commit or stash changes before proceeding.` error message.

   ```bash
    tolgee-migrator migrate -p src/**/*.tsx -r react -k <your openAI api-key>
   ```
   - `-p` - glob pattern to search for files to migrate
   - `-r` - preset according your project stack (currently only `react` is supported)
   - `-k` - your OpenAI API key

   You can also use `--help` to see all available options. Or see them bellow.

### Step 2 - Fixing migrated files and status file

In the second step, you can go over the migrated files and status file and fix them. It's good idea to open each file
diff
in your favourite IDE.

If you add new key to any file, don't forget to add it to the status file.

![Diff example](./docs/img/diff.webp)

The status file is located on this path `.tolgee/migration-status.json`. This is example content:

```json
[
   {
      "src/authenticated/Onboarding.tsx": {
         "migrated": true,
         "keys": [
            {
               "name": "setup-stickies-message",
               "description": "Message shown while setting up stickies",
               "default": "Setting up your stickies..."
            }
         ]
      },
      ...
   ]
```

### Step 3 - `upload-keys` command execution

The upload keys command will upload the keys from the status file to the Tolgee platform. It will save the raw strings
from your code as the base language strings.

```bash 
tolgee-migrator upload-keys -ak tgpak_geytgmztl5shiobrmrzg4ndboe3tcnzsmvuwczlemmzdamtjmm3q
```

When success, it will print the message `Keys successfully uploaded to Tolgee ✅`.

## The migration command
This command iterates over project files and replaces raw strings with Tolgee SDK calls.

See the command help for all available options:

```bash
tolgee-migrator migrate --help
```

```
Migrate files and upload keys to Tolgee

Options:
  -p, --pattern <pattern>             File pattern to search for (e.g., src/**/*.tsx) (default: "src/**/*")
  -a, --appendixPath <appendixPath>   Path to file with custom prompt appendix
  -r, --preset <preset>               Preset to use for migration (default: "react")
  -c, --concurrency <concurrency>     Number of files to process concurrently (default: "10")
  -k, --api-key <apiKey>              OpenAI or Azure OpenAI API key
  -e, --endpoint <endpoint>           Azure OpenAI endpoint
  -d, --deployment <azureDeployment>  Azure OpenAI deployment
  -h, --help                          display help for command
```

