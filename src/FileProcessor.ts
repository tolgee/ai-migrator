import fsExtra from 'fs-extra';
import { ChatGptResponse } from './responseProviders/responseFormat';
import { PresetType } from './presets/PresetType';
import {
  AiProviderOptions,
  createResponseProvider,
} from './responseProviders/createResponseProvider';
import { retryOnError, retryOnRateLimit } from './common/retryOnError';

const { promises: fs } = fsExtra;

export function FileProcessor(
  preset: PresetType,
  providerOptions: AiProviderOptions
) {
  const responseProvider = createResponseProvider(preset, providerOptions);

  async function processFile(filePath: string, promptAppendixPath?: string) {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const promptAppendix = await loadPromptAppendix(promptAppendixPath);
    const result = await getResponseRetrying(fileContent, promptAppendix);
    await writeFileIfKeysExtracted(filePath, result);
    return result;
  }

  async function getResponseRetrying(
    fileContent: string,
    promptAppendix: string
  ) {
    return await retryOnRateLimit({
      callback: async () =>
        retryOnError({
          callback: async () => getResponse(fileContent, promptAppendix),
          retries: 3,
          errorMatcher: (e) => e instanceof SyntaxError,
        }),
      retryAfterProvider: (e: any) => {
        if (e['status'] === 429) {
          const retryAfter = 60000;
          if (!retryAfter) return undefined;
          return retryAfter;
        }
        return undefined;
      },
    });
  }

  // Function to load prompt appendix from a file if path is provided
  async function loadPromptAppendix(filePath?: string): Promise<string> {
    if (!filePath) return '';
    try {
      return await fs.readFile(filePath, 'utf-8');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      throw new Error(
        `[chatGPT] Error loading prompt appendix or path ${filePath}`
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

    const response: ChatGptResponse = JSON.parse(responseJson);
    return response;
  }

  async function writeFileIfKeysExtracted(
    filePath: string,
    result: ChatGptResponse
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
  message: string = 'No response from OpenAI';
  name: string = 'NoResponseError';
}
