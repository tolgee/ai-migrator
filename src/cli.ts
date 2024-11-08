#!/usr/bin/env node

import { Command, Option } from "commander";
import { addMigrationCommand } from "./commands/migrate/addMigrationCommand";
import { addStatusCommand } from "./commands/status/addStatusCommand";
import { addUploadCommand } from "./commands/upload/addUploadCommand";
import { setLogLevel } from "./utils/logger";

// Setup Commander CLI
const program = new Command();

program.name("cli").usage("[command] [options]");
// add log level option
program.addOption(
  new Option("-l, --log-level <level>", "Set the log level").default("info"),
);
addMigrationCommand(program);
addStatusCommand(program)
addUploadCommand(program)

program.parse(process.argv); // Parse the command-line arguments

setLogLevel(program.opts().logLevel);
