// Function to check if the Git working directory is clean
import { execSync } from 'child_process';
import { ExpectedError } from './ExpectedError';

export function checkGitClean() {
  const result = execSync('git status --porcelain').toString().trim();
  if (result) {
    throw new ExpectedError(
      'Migrator requires a clean git state. Please commit or stash changes before proceeding.'
    );
  }
}
