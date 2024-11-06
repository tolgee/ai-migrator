import fsExtra from "fs-extra";
import { extractCreatedKeys } from "./keyExtractor";
import { getOpenAiResponse } from "./getOpenAiResponse";
import { ProviderOptions } from "./responseProviders/getResponseProvider";
import logger from "./utils/logger";

const { promises: fs } = fsExtra;
export const FILE_CONTENTS_KEYWORD = "T components";
export const KEYS_KEYWORD = "KEYS";

// Define a type for the ChatGPT response structure
interface ChatGPTResponse {
  updatedContent: string;
  createdKeys: {
    keyName: string;
    description: string;
    translations: { en: string };
  }[];
}

// Function to load prompt appendix from a file if path is provided
async function loadPromptAppendix(filePath?: string): Promise<string> {
  if (!filePath) return "";
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    logger.error(`Failed to read prompt appendix from ${filePath}: ${error}`);
    return "";
  }
}

// // Helper function to check if keyListString is valid JSON
function isValidJson(keyListString: string): boolean {
  const cleanedString = keyListString.replace(/\s|[\r\n]/g, ""); // Remove whitespace and newline characters
  if (!cleanedString.trim()) {
    return false;
  }

  const openBraces = (cleanedString.match(/{/g) || []).length;
  const closeBraces = (cleanedString.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    return false;
  }

  try {
    JSON.parse(cleanedString);
    return true;
  } catch {
    return false;
  }
}

// Helper function to remove the redundant text
function removeCodeWrappings(responseText: string): string {
  return responseText.replace(/```.*?\n([\s\S]*?)\n```/g, "$1").trim();
}

// Helper function to sanitize the JSON string before parsing
function sanitizeKeyListString(keyListString: string): string {
  // Remove backticks, newline characters, and single-line comments (//...)
  return keyListString
    .replace(/```|[\r\n]/g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();
}

// Function to request a complete response with retries
async function requestCompleteResponse(
  fileContent: string,
  promptAppendix: string,
  options: ProviderOptions,
): Promise<
  { success: boolean; responseText: string; keyListString: string } | undefined
> {
  const lines = fileContent.split("\n");
  const chunkSize = 20;
  let completeResponse = "";
  const finalKeyEntries: Record<string, any> = {}; // Accumulated keys

  try {
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize).join("\n");
      const responseText = await getOpenAiResponse(
        {
          fileContent: chunk,
          promptAppendix,
        },
        options,
      );

      if (!responseText) {
        logger.warn("No response received from OpenAI.");
        return { success: false, keyListString: "", responseText: "" }; // Keep original file
      }

      const cleanedResponseText = removeCodeWrappings(responseText);
      logger.debug(`Full response with delimiters: ${cleanedResponseText}`);

      // Check and extract the T components section
      const componentsPattern = new RegExp(
        `${FILE_CONTENTS_KEYWORD}\\s*(.*?)\\s*(?=${KEYS_KEYWORD})`,
        "s",
      );
      const componentsMatch = componentsPattern.exec(cleanedResponseText);
      if (componentsMatch) {
        const extractedContent = componentsMatch[1].trim();
        if (!extractedContent) {
          logger.warn(
            "Content between delimiters is empty. Keeping original file.",
          );
          return { success: false, keyListString: "", responseText: "" }; // Stop and keep original file
        } else {
          completeResponse += extractedContent + "\n";
        }
      } else {
        logger.warn(
          "Missing delimiter or incomplete content in response. Keeping original file.",
        );
        return { success: false, keyListString: "", responseText: "" }; // Stop and keep original file
      }

      // Check and extract the KEYS section JSON content
      const keysPattern = new RegExp(`${KEYS_KEYWORD}\\s*({.*?})\\s*$`, "s");
      const keysMatch = keysPattern.exec(cleanedResponseText);
      if (keysMatch) {
        const keyListString = sanitizeKeyListString(keysMatch[1]);

        try {
          if (isValidJson(keyListString)) {
            const keyEntries = JSON.parse(keyListString);

            // Append each key entry to the accumulated finalKeyEntries if valid
            Object.assign(finalKeyEntries, keyEntries);
          } else {
            logger.warn(
              "Key list is empty or invalid JSON. Keeping original file.",
            );
            return { success: false, keyListString: "", responseText: "" }; // Stop and keep original file
          }
        } catch (error) {
          logger.error(
            `Failed to parse key entries. Keeping original file ${error}:`,
          );
          return { success: false, keyListString: "", responseText: "" }; // Stop and keep original file
        }
      } else {
        logger.warn(
          "KEYS section missing or incomplete. Keeping original file.",
        );
        return { success: false, keyListString: "", responseText: "" }; // Stop and keep original file
      }
    }

    // Convert accumulated finalKeyEntries to JSON
    const finalKeyListString = JSON.stringify(finalKeyEntries);
    return {
      success: true,
      responseText: completeResponse,
      keyListString: finalKeyListString, // Contains accumulated keys from all chunks
    };
  } catch (error) {
    logger.error(
      `Unexpected error in requestCompleteResponse. Keeping original file: ${error}`,
    );
    return { success: false, keyListString: "", responseText: "" }; // Stop and keep original file
  }
}

// Function to send file content to ChatGPT for migration
export const sendFileToChatGPT = async (
  filePath: string,
  options: ProviderOptions,
  promptAppendixPath?: string,
): Promise<{ success: boolean; result: ChatGPTResponse }> => {
  try {
    // Read the file content from the provided file path
    const fileContent = await fs.readFile(filePath, "utf-8");

    // Load custom instructions from the prompt appendix file if path is provided
    const promptAppendix = await loadPromptAppendix(promptAppendixPath);

    // Get a complete response with error handling
    const response = await requestCompleteResponse(
      fileContent,
      promptAppendix,
      options,
    );

    // Check if response is undefined or success is false
    if (!response || !response.success) {
      logger.error("Failed to obtain a valid response from ChatGPT.");
      return {
        success: false,
        result: { updatedContent: "", createdKeys: [] },
      };
    }

    const { responseText, keyListString } = response;

    const fileContentWithComponents = responseText.trim();

    // Parse the key list from the response
    let createdKeys: {
      keyName: string;
      description: string;
      translations: { en: string };
    }[] = [];
    try {
      createdKeys = extractCreatedKeys(keyListString); // Parse the list of keys
      logger.info(`Parsed created keys: ${createdKeys}`); // Log the parsed list of keys
    } catch (error) {
      logger.error(
        `Failed to parse the list of keys from ChatGPT response. ${error}`,
      );
      return {
        success: false,
        result: { updatedContent: "", createdKeys: [] },
      };
    }

    return {
      success: true,
      result: {
        updatedContent: fileContentWithComponents,
        createdKeys,
      },
    };
  } catch (error) {
    logger.error(`Error during ChatGPT request for ${filePath}: ${error}`);
    return { success: false, result: { updatedContent: "", createdKeys: [] } };
  }
};
