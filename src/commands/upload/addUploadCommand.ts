import { Command, Option } from "commander";
import { uploadKeysToTolgee } from "../../uploadKeysToTolgee";
import { TolgeeProjectClient } from "../../common/client/TolgeeProjectClient";

export function addUploadCommand(program: Command) {
  program
    .command("upload-keys")
    .description("Upload the localization strings to Tolgee")
    // TODO: Align with tolgee CLI
    .addOption(new Option("-p, --projectId <projectId>", "Tolgee project ID"))
    .addOption(new Option("-a, --apiKey <apiKey>", "Tolgee API key"))
    .addOption(new Option("-u, --apiUrl <apiUrl>", "Tolgee API URL"))
    .action(async function (opts) {
      const client = TolgeeProjectClient({
        projectId: opts["projectId"],
        apiKey: opts["apiKey"],
        apiUrl: opts["apiUrl"],
      });
      await uploadKeysToTolgee(client);
    });
}
