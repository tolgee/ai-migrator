#!/usr/bin/env node

import { Command } from "commander";
import { addMigrationCommand } from "./commands/migrate/addMigrationCommand";
import { addStatusCommand } from "./commands/status/addStatusCommand";
import {addUploadCommand} from "./commands/upload/addUploadCommand";

// Setup Commander CLI
const program = new Command();

program.name("cli").usage("[command] [options]");

addMigrationCommand(program);
addStatusCommand(program)
addUploadCommand(program)

program.parse(process.argv); // Parse the command-line arguments
