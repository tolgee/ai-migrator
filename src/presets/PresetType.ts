import { z } from 'zod';

export const presetShape = z.object({
  name: z.string(),
  getUserPrompt: z
    .function()
    .args(z.object({ fileContent: z.string() }))
    .returns(z.string()),
  getSystemPrompt: z.function().returns(z.string()),
});

export type PresetType = z.infer<typeof presetShape>;
