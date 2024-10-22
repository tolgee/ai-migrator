import fsExtra from "fs-extra";
import { extractCreatedKeys } from "./keyExtractor";
import inquirer from "inquirer";
import { getOpenAiResponse } from "./getOpenAiResponse";

const { promises: fs } = fsExtra;
export const FILE_CONTENTS_KEYWORD = "---T components---";
export const KEYS_KEYWORD = "---KEYS---";

// Define a type for the ChatGPT response structure
interface ChatGPTResponse {
  updatedContent: string;
  createdKeys: {
    keyName: string;
    description: string;
    translations: { en: string };
  }[];
}

// Function to send file content to ChatGPT for migration
export const sendFileToChatGPT = async (
  filePath: string,
): Promise<ChatGPTResponse> => {
  try {
    // Read the file content from the provided file path
    const fileContent = await fs.readFile(filePath, "utf-8");

    // Ask user for additional instructions
    const { promptAppendix } = await inquirer.prompt([
      {
        type: "input",
        name: "promptAppendix",
        message:
          "Do you want to provide custom instructions to ChatGPT? (Press Enter to skip)",
      },
    ]);

    const responseText = await getOpenAiResponse({
      fileContent,
      promptAppendix,
    });

    if (!responseText) {
      console.error("No updated content received from OpenAI.");
      return {
        updatedContent: "",
        createdKeys: [],
      };
    }

    console.log(
      "Full response text with delimiters from OpenAI:",
      responseText,
    ); // Log the full response text

    // Extract the content between the delimiters
    const componentsStart =
      responseText.indexOf(FILE_CONTENTS_KEYWORD) +
      FILE_CONTENTS_KEYWORD.length;
    const componentsEnd = responseText.indexOf(KEYS_KEYWORD);
    const fileContentWithComponents = responseText
      .substring(componentsStart, componentsEnd)
      .trim();

    const responseParts = responseText?.split(KEYS_KEYWORD); // Split the response at a marker like `---KEYS---`
    if (!responseParts) {
      console.error("Failed to split the response text.");
      return {
        updatedContent: "",
        createdKeys: [],
      };
    }

    const keyListString = responseParts[1]; // The JSON-like string for the key list
    if (!keyListString) {
      console.error("Failed to access list of keys.");
      return {
        updatedContent: "",
        createdKeys: [],
      };
    }
    console.log("Key list string from ChatGPT:", keyListString); // Log the raw key list string

    // Parse the key list from the response
    let createdKeys: {
      keyName: string;
      description: string;
      translations: { en: string };
    }[] = [];
    try {
      createdKeys = extractCreatedKeys(keyListString); // Parse the list of keys
      console.log("Parsed created keys:", createdKeys); // Log the parsed list of keys
    } catch (error) {
      console.error(
        "Failed to parse the list of keys from ChatGPT response.",
        error,
      );
      createdKeys = [];
    }

    return {
      updatedContent: fileContentWithComponents,
      createdKeys,
    };
  } catch (error) {
    console.error(
      `Error during ChatGPT request processing for ${filePath}: ${error}`,
    );
    return {
      updatedContent: "",
      createdKeys: [],
    };
  }
};
