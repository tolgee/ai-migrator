import fsExtra from "fs-extra";
import inquirer from "inquirer";

const tempFilePath = "allKeys.json";

type KeyObject = {
  keyName: string;
  description: string;
  translations: { en: string };
};

// Function to save or append keys
export const saveKeys = async (filePath: string, keys: KeyObject[]) => {
  try {
    const fileExists = await fsExtra.pathExists(tempFilePath);

    if (fileExists) {
      // Ask the user if they want to overwrite or append
      const { overwrite } = await inquirer.prompt({
        type: "confirm",
        name: "overwrite",
        message:
          "The allKeys file already exists. Do you want to overwrite it?",
        default: false,
      });

      if (overwrite) {
        // Overwrite the file
        const newData = { [filePath]: keys };
        await fsExtra.writeJson(tempFilePath, newData, { spaces: 2 });
        console.log("Keys have been overwritten in the allKeys file.");
      } else {
        // Append to the file
        const existingKeys = await fsExtra.readJson(tempFilePath);
        // Add or update the keys for the given file path
        existingKeys[filePath] = existingKeys[filePath]
          ? [...existingKeys[filePath], ...keys]
          : keys;

        await fsExtra.writeJson(tempFilePath, existingKeys, { spaces: 2 });
        console.log("Keys have been added to the existing allKeys file.");
      }
    } else {
      // If file doesn't exist, create it
      const newData = { [filePath]: keys };
      await fsExtra.writeJson(tempFilePath, newData, { spaces: 2 });
      console.log("Keys have been saved to a new allKeys file.");
    }
  } catch (error) {
    console.error("Error saving keys:", error);
  }
};
