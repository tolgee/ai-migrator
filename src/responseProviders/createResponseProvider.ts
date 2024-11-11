import { ResponseProvider } from './ResponseProvider';
import { AzureResponseProvider } from './AzureResponseProvider';
import { OpenAiResponseProvider } from './OpenAiResponseProvider';
import { PromptsProvider } from '../PromptsProvider';
import { PresetType } from '../presets/PresetType';
import {ExpectedError} from "../common/ExpectedError";

const apiVersion = '2024-10-01-preview';
type ApiProvider = 'AZURE_OPENAI' | 'OPENAI';

export type AiProviderOptions = {
  openAiApiKey?: string;
  azureApiKey?: string;
  azureEndpoint?: string;
  azureDeployment?: string;
};

export function createResponseProvider(
  preset: PresetType,
  providerOptions: AiProviderOptions
): ResponseProvider {
  const apiProviderType: ApiProvider = getApiProviderType(providerOptions);
  const promptsProvider = PromptsProvider(preset);

  const { openAiApiKey, azureApiKey, azureEndpoint, azureDeployment } =
    providerOptions;

  switch (apiProviderType) {
    case 'AZURE_OPENAI':
      return AzureResponseProvider({
        config: {
          azureApiKey: azureApiKey!,
          azureEndpoint,
          deployment: azureDeployment,
          apiVersion,
        },
        promptsProvider,
      });
    case 'OPENAI':
      return OpenAiResponseProvider({
        openAiApiKey: openAiApiKey!,
        promptsProvider,
      });
  }
}

function getApiProviderType({
  azureApiKey,
  azureEndpoint,
  openAiApiKey,
}: AiProviderOptions): ApiProvider {
  if (azureApiKey && azureEndpoint) {
    return 'AZURE_OPENAI';
  }

  if (openAiApiKey) {
    return 'OPENAI';
  }

  throw new ExpectedError(
    'No API provider credentials specified in configuration, specify either OpenAI or Azure OpenAI credentials'
  );
}
