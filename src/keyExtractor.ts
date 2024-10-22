export interface CreatedKey {
  keyName: string;
  description: string;
  translations: { en: string };
}

// Function to extract created keys from ChatGPT's response
export const extractCreatedKeys = (keyListString: string): CreatedKey[] => {
  const createdKeys: CreatedKey[] = [];

  // Match each key block, which consists of a key name and its associated content inside curly braces
  const keyBlocks = keyListString.match(/"([^"]+)":\s*{([^}]+)}/g);

  if (keyBlocks) {
    keyBlocks.forEach((block) => {
      // Extract the key name (before the colon)
      const keyNameMatch = block.match(/"([^"]+)":/);
      const keyName = keyNameMatch ? keyNameMatch[1] : "";

      // Extract the description
      const descriptionMatch = block.match(/"description":\s*"([^"]+)"/);
      const description = descriptionMatch
        ? descriptionMatch[1]
        : "No description provided";

      // Extract the English translation
      const translationsMatch = block.match(/"en":\s*"([^"]+)"/);
      const enTranslation = translationsMatch
        ? translationsMatch[1]
        : "No translation provided";

      // Add the parsed data to the createdKeys array
      createdKeys.push({
        keyName: keyName,
        description,
        translations: { en: enTranslation },
      });
    });
  } else {
    console.error("No key blocks found in response.");
  }

  return createdKeys;
};
