#!/usr/bin/env node

import { setLogLevel } from "./utils/logger";
import {createProgram} from "./program";

const program = createProgram();
program.parse(process.argv); // Parse the command-line arguments

setLogLevel(program.opts().logLevel);
