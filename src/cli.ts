#!/usr/bin/env node

import logger, { setLogLevel } from './utils/logger';
import { createProgram } from './program';
import { ExpectedError } from './common/ExpectedError';

async function main() {
  const program = createProgram();
  try {
    const promise = program.parseAsync(process.argv); // Parse the command-line arguments

    const logLevel = program.opts().logLevel;
    setLogLevel(logLevel);
    await promise;
  } catch (e) {
    if (e instanceof ExpectedError) {
      logErrorWithoutStackTrace(e);
      process.exit(1);
    }
    logger.error(e);
    process.exit(1);
  }
}

function logErrorWithoutStackTrace(e: ExpectedError) {
  logger.error(e.message);
}

main();
