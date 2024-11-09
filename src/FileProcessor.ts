import fsExtra from "fs-extra";
import { ChatGptResponse } from "./responseProviders/responseFormat";
import { PresetType } from "./presets/PresetType";
import { createResponseProvider } from "./responseProviders/createResponseProvider";

const { promises: fs } = fsExtra;

export function FileProcessor(preset: PresetType) {
  const responseProvider = createResponseProvider(preset);

  // Function to send file content to ChatGPT for migration
  async function processFile(filePath: string, promptAppendixPath?: string) {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const promptAppendix = await loadPromptAppendix(promptAppendixPath);
    return await requestCompleteResponse(fileContent, promptAppendix);
  }

  // Function to load prompt appendix from a file if path is provided
  async function loadPromptAppendix(filePath?: string): Promise<string> {
    if (!filePath) return "";
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      throw new Error(
        `[chatGPT] Error loading prompt appendix or path ${filePath}`,
      );
    }
  }

  // Function to request a complete response with retries
  async function requestCompleteResponse(
    fileContent: string,
    promptAppendix: string,
  ) {
    const responseJson = await responseProvider.getResponse({
      fileContent: fileContent,
      promptAppendix,
    });

    if (!responseJson) {
      throw new NoResponseError();
    }

    try {
      const response: ChatGptResponse = JSON.parse(responseJson);
      return response;
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw Error("[chatGPT] Error parsing response JSON");
      }
      throw e;
    }
  }

  return {
    processFile,
  };
}

export class NoResponseError implements Error {
  message: string = "No response from OpenAI";
  name: string = "NoResponseError";
}
