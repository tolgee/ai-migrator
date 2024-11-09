import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const keySchema = z.object({
  name: z.string(),
  description: z.string(),
  default: z.string(),
});

const schema = z.object({
  newFileContents: z.string(),
  keys: z.array(keySchema),
});

export const chatGptResponseFormat = zodResponseFormat(schema, "data");

export type ChatGptResponse = z.infer<typeof schema>;
export type Key = z.infer<typeof keySchema>;
