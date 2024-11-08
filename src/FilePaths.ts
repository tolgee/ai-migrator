import * as path from "node:path";

function FilePaths(workingDir?: string) {
  if (!workingDir) {
    workingDir = process.cwd();
  }

  const storageDir = path.resolve(workingDir, ".tolgee");
  const allKeysFilePath = `${storageDir}/allKeys.json`;
  const statusFilePath = `${storageDir}/migration-status.json`;

  return {
    allKeysFilePath,
    statusFilePath,
    storageDir,
  }
}

export function getFilePaths(){
  return FilePaths();
}
