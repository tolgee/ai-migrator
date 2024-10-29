import { GetResponseProps, ResponseProvider } from "./ResponseProvider";
import { getPrompts } from "../promptsProvider";
import { AzureOpenAI } from "openai";

export function AzureResponseProvider(config: {
  apiVersion: string;
  azureApiKey: any;
  azureEndpoint: any;
  deployment: any;
}): ResponseProvider {
  const azureClient = new AzureOpenAI({
    apiKey: config.azureApiKey,
    endpoint: config.azureEndpoint,
    deployment: config.deployment,
    apiVersion: config.apiVersion,
  });

  return {
    async getResponse(
      props: GetResponseProps,
    ): Promise<string | null | undefined> {
      const { completeSystemPrompt, userPrompt } = getPrompts(props);

      const response = await azureClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: completeSystemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 1024,
      });

      // Extract the file content and keys separately from the response
      return response.choices[0]?.message.content; // Full response text
    },
  };
}
