import { ResponseProvider } from "./ResponseProvider";
import { AzureResponseProvider } from "./AzureResponseProvider";
import { OpenAiResponseProvider } from "./OpenAiResponseProvider";
import dotenv from "dotenv";

dotenv.config();

// Load environment variables
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const openAiApiKey = process.env.OPENAI_API_KEY;

const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = "2023-03-15-preview";
type ApiProvider = "AZURE_OPENAI" | "OPENAI";

export function getResponseProvider(): ResponseProvider {
  const apiProviderType: ApiProvider = getApiProviderType();

  switch (apiProviderType) {
    case "AZURE_OPENAI":
      return AzureResponseProvider({
        azureApiKey: azureApiKey!,
        azureEndpoint,
        deployment,
        apiVersion,
      });
    case "OPENAI":
      return OpenAiResponseProvider({ openAiApiKey: openAiApiKey! });
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
