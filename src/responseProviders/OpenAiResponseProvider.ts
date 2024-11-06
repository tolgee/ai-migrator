import { GetResponseProps, ResponseProvider } from "./ResponseProvider";
import { OpenAI } from "openai";
import { getPrompts } from "../promptsProvider";
import { retryWithExponentialBackoff } from "./retryRequest";

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

      return await retryWithExponentialBackoff(async () => {
        const response = await openai.chat.completions.create(
          {
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
          },
          {
            headers: {
              Authorization: `Bearer ${openAiApiKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        return response.choices[0]?.message.content;
      });
    },
  };
}
