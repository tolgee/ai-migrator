import { Command } from "commander";
import { presetShape, PresetType } from "../../presets/PresetType";
import { buildNativePreset } from "../../presets/buildNativePreset";
import { z } from "zod";
import logger from "../../utils/logger";
import { FilesMigrator } from "./FilesMigrator";

export function addMigrationCommand(program: Command) {
  // Migrate command
  program
    .command("migrate")
    .description("Migrate files and upload keys to Tolgee")
    .option(
      "-p, --pattern <pattern>",
      "File pattern to search for (e.g., src/**/*.tsx)",
      "src/**/*.tsx",
    )
    .option(
      "-a, --appendixPath <appendixPath>",
      "Path to file with custom prompt appendix",
    )
    .option("-r, --preset <preset>", "Preset to use for migration", "react")
    .option(
      "-c, --chunk-size <chunkSize>",
      "Chunk size for files processing. If greater than 1, files will be sent to ChatGPT in parallel.",
      "5",
    )
    .action(async (options) => {
      const { pattern, appendixPath, preset, chunkSize } = options;
      // Run the migration process
      const migrator = FilesMigrator({
        filePattern: pattern,
        preset: getAndValidatePreset(preset),
        appendixPath: appendixPath,
        chunkSize: parseInt(chunkSize),
      });

      await migrator.migrateFiles();
    });
}

function getAndValidatePreset(preset: string): PresetType {
  const presetObject = getPreset(preset);
  try {
    validatePreset(presetObject);
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.error(`Invalid custom preset: ${preset}`, e.errors);
      throw e;
    }
  }
  return presetObject;
}

function getPreset(preset: string): PresetType {
  if (preset.endsWith(".js")) {
    return require(preset);
  }

  return buildNativePreset(preset);
}

export function validatePreset(preset: PresetType) {
  presetShape.parse(preset);
}
