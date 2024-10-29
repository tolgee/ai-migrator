export interface CreatedKey {
  keyName: string;
  description: string;
  translations: { en: string };
}

// Function to extract created keys from ChatGPT's response
export const extractCreatedKeys = (keyListString: string): CreatedKey[] => {
  const createdKeys: CreatedKey[] = [];

  try {
    // Parse the JSON string
    const keyObjects = JSON.parse(keyListString);
    if (Array.isArray(keyObjects)) {
      keyObjects.forEach((key) => {
        // Validate the structure of each key object
        if (
          key.name &&
          typeof key.name === "string" &&
          key.description &&
          typeof key.description === "string" &&
          key.translations &&
          typeof key.translations.en === "string"
        ) {
          // Push validated keys to the array
          createdKeys.push({
            keyName: key.name,
            description: key.description,
            translations: { en: key.translations.en },
          });
        } else {
          console.warn("Invalid key structure found:", key);
        }
      });
    } else {
      console.error("[keyExtractor] Expected an array of key objects.");
    }
  } catch (error) {
    console.error("[keyExtractor] Failed to parse JSON:", error);
  }

  return createdKeys;
};
