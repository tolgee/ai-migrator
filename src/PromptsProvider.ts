import { PresetType } from './presets/PresetType';

export function PromptsProvider(preset: PresetType) {
  function getPrompts({
    fileContent,
    promptAppendix,
  }: {
    fileContent: string;
    promptAppendix: string;
  }) {
    const systemPrompt = preset.getSystemPrompt();

    // Append the promptAppendix if provided
    const completeSystemPrompt = promptAppendix
      ? `${systemPrompt}\n\nAdditional Instructions:\n${promptAppendix}`
      : systemPrompt;

    const userPrompt = preset.getUserPrompt({ fileContent });

    return { systemPrompt: completeSystemPrompt, userPrompt };
  }

  return {
    getPrompts,
  };
}

export type PromptsProviderType = ReturnType<typeof PromptsProvider>;
