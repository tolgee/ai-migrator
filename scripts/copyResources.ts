// copy all *.handlebars files to the dist folder with the same structure

import * as fs from 'fs-extra';
import * as path from 'path';
import glob from 'fast-glob';

async function copyHandlebarsFiles() {
  const sourcePattern = 'src/**/*.handlebars';
  const destinationRoot = 'dist';

  try {
    const files = await glob(sourcePattern);

    for (const file of files) {
      const relativePath = path.relative('.', file);
      const destinationPath = path.join(destinationRoot, relativePath);

      await fs.copy(file, destinationPath);
      console.log(`Copied ${file} to ${destinationPath}`);
    }
  } catch (err) {
    console.error('Error copying files:', err);
  }
}

copyHandlebarsFiles();
