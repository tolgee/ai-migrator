import { GetResponseProps, ResponseProvider } from './ResponseProvider';
import { OpenAI } from 'openai';
import { PromptsProviderType } from '../PromptsProvider';
import { chatGptResponseFormat } from './responseFormat';

export function OpenAiResponseProvider({
  openAiApiKey,
  promptsProvider,
}: {
  openAiApiKey: string;
  promptsProvider: PromptsProviderType;
}): ResponseProvider {
  const openai = new OpenAI({
    apiKey: openAiApiKey,
  });

  return {
    async getResponse(
      props: GetResponseProps
    ): Promise<string | null | undefined> {
      const { systemPrompt, userPrompt } = promptsProvider.getPrompts(props);

      const response = await openai.chat.completions.create(
        {
          model: 'gpt-4o-2024-08-06',
          response_format: chatGptResponseFormat,
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
        },
        {
          headers: {
            Authorization: `Bearer ${openAiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.choices[0]?.message.content;
    },
  };
}
