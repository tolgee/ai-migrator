import { Command } from 'commander';
import { presetShape, PresetType } from '../../presets/PresetType';
import { buildNativePreset } from '../../presets/buildNativePreset';
import { z } from 'zod';
import logger from '../../utils/logger';
import { FilesMigrator } from './FilesMigrator';

export function addMigrationCommand(program: Command) {
  // Migrate command
  program
    .command('migrate')
    .description('Migrates files and creates status file ')
    .option(
      '-p, --pattern <pattern>',
      'File pattern to search for (e.g., src/**/*.tsx)',
      'src/**/*'
    )
    .option(
      '-a, --appendixPath <appendixPath>',
      'Path to file with custom prompt appendix'
    )
    .option('-r, --preset <preset>', 'Preset to use for migration', 'react')
    .option(
      '-c, --concurrency <concurrency>',
      'Number of files to process concurrently',
      '10'
    )
    .option('-k, --api-key <apiKey>', 'OpenAI or Azure OpenAI API key')
    .option('-e, --endpoint <endpoint>', 'Azure OpenAI endpoint')
    .option('-d, --deployment <azureDeployment>', 'Azure OpenAI deployment')
    .action(async (options) => {
      // Run the migration process
      const migrator = FilesMigrator({
        filePattern: options.pattern,
        preset: getAndValidatePreset(options.preset),
        appendixPath: options.appendixPath,
        concurrency: parseInt(options.concurrency),
        providerOptions: {
          openAiApiKey: options.apiKey,
          azureApiKey: options.apiKey,
          azureEndpoint: options.endpoint,
          azureDeployment: options.deployment,
        },
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
  if (preset.endsWith('.js')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(preset);
  }

  return buildNativePreset(preset);
}

export function validatePreset(preset: PresetType) {
  presetShape.parse(preset);
}
