import fsExtra from "fs-extra";
import { ChatGptResponse } from "./responseProviders/responseFormat";
import { PresetType } from "./presets/PresetType";
import { createResponseProvider } from "./responseProviders/createResponseProvider";
import logger from "./utils/logger";

const { promises: fs } = fsExtra;

export function FileProcessor(preset: PresetType) {
  const responseProvider = createResponseProvider(preset);

  async function processFile(filePath: string, promptAppendixPath?: string) {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const promptAppendix = await loadPromptAppendix(promptAppendixPath);
    const result = await getResponseRetrying(fileContent, promptAppendix);
    await writeFileIfKeysExtracted(filePath, result);
    return result;
  }


  // TODO: Test this
  async function getResponseRetrying(
    fileContent: string,
    promptAppendix: string,
  ) {
    const retries = 3;
    let response: ChatGptResponse | null = null;
    for (let i = 0; i < retries; i++) {
      try {
        response = await getResponse(fileContent, promptAppendix);
        break;
      } catch (e) {
        if (e instanceof SyntaxError) {
          logger.info(`Retrying on GPT response parse error...`);
          continue;
        }
        throw e;
      }
    }

    return response!;
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
  async function getResponse(fileContent: string, promptAppendix: string) {
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
      throw e;
    }
  }

  async function writeFileIfKeysExtracted(
    filePath: string,
    result: ChatGptResponse,
  ) {
    if (result.keys.length > 0) {
      await fs.writeFile(filePath, result.newFileContents);
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
