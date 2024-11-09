import { ResponseProvider } from "./ResponseProvider";
import { AzureResponseProvider } from "./AzureResponseProvider";
import { OpenAiResponseProvider } from "./OpenAiResponseProvider";
import dotenv from "dotenv";
import { PromptsProvider } from "../PromptsProvider";
import { PresetType } from "../presets/PresetType";

dotenv.config();

// TODO: Get rid of the environment
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const openAiApiKey = process.env.OPENAI_API_KEY;

const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = "2024-10-01-preview";
type ApiProvider = "AZURE_OPENAI" | "OPENAI";

export function createResponseProvider(preset: PresetType): ResponseProvider {
  const apiProviderType: ApiProvider = getApiProviderType();
  const promptsProvider = PromptsProvider(preset);
  switch (apiProviderType) {
    case "AZURE_OPENAI":
      return AzureResponseProvider({
        config: {
          azureApiKey: azureApiKey!,
          azureEndpoint,
          deployment,
          apiVersion,
        },
        promptsProvider,
      });
    case "OPENAI":
      return OpenAiResponseProvider({
        openAiApiKey: openAiApiKey!,
        promptsProvider,
      });
  }
}

function getApiProviderType(): ApiProvider {
  if (azureApiKey && azureEndpoint) {
    return "AZURE_OPENAI";
  }

  if (openAiApiKey) {
    return "OPENAI";
  }

  throw new Error(
    "No API provider credentials specified in .env file, specify either Azure OpenAI or OpenAI credentials",
  );
}
