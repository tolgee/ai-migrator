import axios from "axios";

interface KeyObject {
  keyName: string;
  description: string;
  translations: { en: string };
}

interface TolgeeUploadResponse {
  success: boolean;
  message: string;
}

export const uploadKeysToTolgee = async (
  keys: KeyObject[],
): Promise<TolgeeUploadResponse> => {
  try {
    const formattedKeys = keys.map((key) => ({
      keyName: key.keyName,
      description: key.description,
      translations: key.translations, // English as default translation
    }));

    await axios.post("https://tolgee.io/api/import-keys-2", {
      keys: formattedKeys,
    });

    console.log("[uploadKeysToTolgee] Keys uploaded successfully to Tolgee.");
    return {
      success: true,
      message: "Keys uploaded successfully",
    };
  } catch (error) {
    console.error(
      `[uploadKeysToTolgee] Error uploading keys to Tolgee: ${error}`,
    );
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      message: `Failed to upload keys: ${errorMessage}`,
    };
  }
};
