import { Command } from "commander";
import { checkMigrationStatus } from "../../migrationStatus";

export function addStatusCommand(program: Command) {
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
}
