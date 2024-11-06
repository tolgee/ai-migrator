import { ResponseProvider } from "./ResponseProvider";
import { AzureResponseProvider } from "./AzureResponseProvider";
import { OpenAiResponseProvider } from "./OpenAiResponseProvider";
import dotenv from "dotenv";

dotenv.config();

export interface ProviderOptions {
  azureApiKey?: string;
  azureEndpoint?: string;
  openAiApiKey?: string;
}

const deployment = "gpt-4o";
const apiVersion = "2023-03-15-preview";
type ApiProvider = "AZURE_OPENAI" | "OPENAI";

export function getResponseProvider(
  options: ProviderOptions,
): ResponseProvider {
  const apiProviderType: ApiProvider = getApiProviderType(options);

  switch (apiProviderType) {
    case "AZURE_OPENAI":
      if (!options.azureApiKey || !options.azureEndpoint) {
        throw new Error(
          "Azure OpenAI API credentials are incomplete. Please provide both azureApiKey and azureEndpoint.",
        );
      }
      return AzureResponseProvider({
        azureApiKey: options.azureApiKey!,
        azureEndpoint: options.azureEndpoint,
        deployment,
        apiVersion,
      });
    case "OPENAI":
      if (!options.openAiApiKey) {
        throw new Error(
          "OpenAI API key is missing. Please provide openAiApiKey.",
        );
      }
      return OpenAiResponseProvider({ openAiApiKey: options.openAiApiKey! });
  }
}

function getApiProviderType(options: ProviderOptions): ApiProvider {
  if (options.azureApiKey && options.azureEndpoint) {
    return "AZURE_OPENAI";
  }

  if (options.openAiApiKey) {
    return "OPENAI";
  }

  throw new Error(
    "No API provider credentials specified. Provide either Azure OpenAI credentials (API key and endpoint) or OpenAI API key as command-line arguments.",
  );
}
