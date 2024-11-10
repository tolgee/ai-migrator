#!/usr/bin/env node

import logger, { setLogLevel } from './utils/logger';
import { createProgram } from './program';

async function main() {
  const program = createProgram();
  try {
    const promise = program.parseAsync(process.argv); // Parse the command-line arguments

    const logLevel = program.opts().logLevel;
    setLogLevel(logLevel);
    await promise;
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

main();
