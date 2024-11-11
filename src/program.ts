import { Command, Option } from 'commander';
import { addMigrationCommand } from './commands/migrate/addMigrationCommand';
import { addUploadCommand } from './commands/upload/addUploadCommand';

export function createProgram(): Command {
  const program = new Command();

  program.name('tolgee-migrator').usage('[command] [options]');
  program.addOption(
    new Option('-l, --log-level <level>', 'Set the log level').default('info')
  );
  addMigrationCommand(program);
  addUploadCommand(program);

  return program;
}
