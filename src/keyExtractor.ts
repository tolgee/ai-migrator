export interface CreatedKey {
  keyName: string;
  description: string;
  translations: { en: string };
}

interface KeyDetails {
  description: string;
  translations: { en: string };
}

// Function to extract created keys from ChatGPT's response
export const extractCreatedKeys = (keyListString: string): CreatedKey[] => {
  const createdKeys: CreatedKey[] = [];

  try {
    // Remove single-line comments (// ...) from the JSON string
    const sanitizedString = keyListString.replace(/\/\/.*$/gm, "");

    // Check for unbalanced braces
    const openBraces = (sanitizedString.match(/{/g) || []).length;
    const closeBraces = (sanitizedString.match(/}/g) || []).length;

    // Add missing closing braces if needed
    let finalString = sanitizedString;
    if (openBraces > closeBraces) {
      finalString += "}".repeat(openBraces - closeBraces);
      console.warn("[keyExtractor] JSON was incomplete; added missing braces.");
    }

    // Parse the JSON string
    const keyObjects = JSON.parse(finalString);

    console.log("keyObjects", keyObjects);

    // Process each key-value pair in the object
    for (const [keyName, keyDetails] of Object.entries(keyObjects)) {
      const details = keyDetails as KeyDetails; // Type assertion

      // Validate the structure of each key details object
      if (
        details &&
        typeof details === "object" &&
        typeof details.description === "string" &&
        details.translations &&
        typeof details.translations.en === "string"
      ) {
        // Push validated keys to the array
        createdKeys.push({
          keyName,
          description: details.description,
          translations: { en: details.translations.en },
        });
      } else {
        console.warn("Invalid key structure found for:", keyName);
      }
    }
  } catch (error) {
    console.error("[keyExtractor] Failed to parse JSON:", error);
  }

  return createdKeys;
};
