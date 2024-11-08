import { GetResponseProps, ResponseProvider } from "./ResponseProvider";
import { OpenAI } from "openai";
import { getPrompts } from "../promptsProvider";
import { chatGptResponseFormat } from "./responseFormat";

export function OpenAiResponseProvider({
  openAiApiKey,
}: {
  openAiApiKey: string;
}): ResponseProvider {
  const openai = new OpenAI({
    apiKey: openAiApiKey,
  });

  return {
    async getResponse(
      props: GetResponseProps,
    ): Promise<string | null | undefined> {
      const { completeSystemPrompt, userPrompt } = getPrompts(props);

      const response = await openai.chat.completions.create(
        {
          model: "gpt-4o",
          response_format: chatGptResponseFormat,
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