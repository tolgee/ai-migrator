// Function to check if the Git working directory is clean
import {execSync} from "child_process";

export function checkGitClean(): boolean {
  const result = execSync("git status --porcelain").toString().trim();
  if (result) {
    console.error(
      "[cli][checkGitClean] Migrator requires a clean git state. Please commit or stash changes before proceeding.",
    );
    return false;
  }
  return true;
}
