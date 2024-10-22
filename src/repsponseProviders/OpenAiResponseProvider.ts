import { GetResponseProps, ResponseProvider } from "./ResponseProvider";
import { AzureOpenAI, OpenAI } from "openai";
import { getPrompts } from "../promptsProvider";

export function OpenAiResponseProvider({
  openAiApiKey,
}: {
  openAiApiKey: string;
}): ResponseProvider {
  const openai = new OpenAI({
    apiKey: openAiApiKey,
  });

  return {
    async getResponse(props: GetResponseProps): Promise<string | null> {
      const { systemPrompt, userPrompt } = getPrompts(props);

      const response = await openai.chat.completions.create(
        {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${openAiApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.choices[0]?.message.content;
    },
  };
}
