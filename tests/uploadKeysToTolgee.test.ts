import { uploadKeysToTolgee } from "../src/uploadKeysToTolgee";
import axios from "axios";

jest.mock("axios");

describe("uploadKeysToTolgee", () => {
  it("should upload keys to the Tolgee API", async () => {
    const mockResponse = { data: { success: true } };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    // Create an array of KeyObject matching the required structure
    const keys = [
      {
        keyName: "key1",
        description: "This is key 1",
        translations: { en: "Key 1" },
      },
    ];

    const result = await uploadKeysToTolgee(keys);

    expect(axios.post).toHaveBeenCalledWith(
      "https://tolgee.io/api/import-keys-2",
      {
        keys: [
          {
            keyName: "key1",
            description: "This is key 1",
            translations: { en: "Key 1" },
          },
        ],
      },
    );

    expect(result).toEqual({
      success: true,
      message: "Keys uploaded successfully",
    });
  });

  it("should handle errors during the upload", async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error("Upload error"));

    const keys = [
      {
        keyName: "key1",
        description: "This is key 1",
        translations: { en: "Key 1" },
      },
    ];

    const result = await uploadKeysToTolgee(keys);

    expect(result).toEqual({
      success: false,
      message: "Failed to upload keys: Upload error",
    });
  });
});
