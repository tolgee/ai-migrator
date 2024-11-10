import { Command, Option } from "commander";
import { uploadKeysToTolgee } from "../../uploadKeysToTolgee";
import { TolgeeProjectClient } from "../../common/client/TolgeeProjectClient";

export function addUploadCommand(program: Command) {
  program
    .command("upload-keys")
    .description("Upload the localization strings to Tolgee")
    .addOption(new Option("-au, --api-url <apiUrl>", "Tolgee API URL"))
    .addOption(new Option("-ak, --api-key <apiKey>", "Tolgee API key"))
    .addOption(new Option("-p, --project-id <projectId>", "Tolgee project ID (required only when using project API key)"))
    .action(async function (opts) {
      const client = TolgeeProjectClient({
        projectId: opts["projectId"],
        apiKey: opts["apiKey"],
        apiUrl: opts["apiUrl"],
      });
      await uploadKeysToTolgee(client);
    });
}
