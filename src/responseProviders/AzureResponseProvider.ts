import { GetResponseProps, ResponseProvider } from './ResponseProvider';
import { AzureOpenAI } from 'openai';
import { chatGptResponseFormat } from './responseFormat';
import { PromptsProviderType } from '../PromptsProvider';

export function AzureResponseProvider(providerProps: {
  config: {
    apiVersion: string;
    azureApiKey: any;
    azureEndpoint: any;
    deployment: any;
  };
  promptsProvider: PromptsProviderType;
}): ResponseProvider {
  const azureClient = new AzureOpenAI({
    apiKey: providerProps.config.azureApiKey,
    endpoint: providerProps.config.azureEndpoint,
    deployment: providerProps.config.deployment,
    apiVersion: providerProps.config.apiVersion,
  });

  return {
    async getResponse(
      props: GetResponseProps
    ): Promise<string | null | undefined> {
      const { systemPrompt, userPrompt } =
        providerProps.promptsProvider.getPrompts(props);

      const response = await azureClient.chat.completions.create({
        model: 'gpt-4o',
        response_format: chatGptResponseFormat,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract the file content and keys separately from the response
      return response.choices[0]?.message.content; // Full response text
    },
  };
}
