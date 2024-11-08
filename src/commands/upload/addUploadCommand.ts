import {Command} from "commander";
import fsExtra from "fs-extra";
import {uploadKeysToTolgee} from "../../uploadKeysToTolgee";

export function addUploadCommand(program: Command){
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
}
