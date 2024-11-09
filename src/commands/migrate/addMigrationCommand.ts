import { Command, Option } from "commander";
import { migrateFiles } from "./migrateFiles";
import { presetShape, PresetType } from "../../presets/PresetType";
import { buildNativePreset } from "../../presets/buildNativePreset";
import { z } from "zod";
import logger from "../../utils/logger";

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
    .action(async (options) => {
      const { pattern, appendixPath, preset } = options;
      // Run the migration process
      await migrateFiles({
        filePattern: pattern,
        preset: getAndValidatePreset(preset),
        appendixPath: appendixPath,
      });
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
