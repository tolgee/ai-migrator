import { extractCreatedKeys } from "../src/keyExtractor";

describe("keyExtractor", () => {
  it("should extract keys correctly from a structured JSON string", () => {
    const fileContent = `
    {
      "submit_button": {
        "description": "Button to submit a form.",
        "en": "Submit"
      }
    }`;
    const keys = extractCreatedKeys(fileContent);
    expect(keys).toEqual([
      {
        keyName: "submit_button",
        description: "Button to submit a form.",
        translations: { en: "Submit" },
      },
    ]);
  });

  it("should handle files with no keys", () => {
    const fileContent = "No keys here!";
    const keys = extractCreatedKeys(fileContent);
    expect(keys).toEqual([]);
  });
});
